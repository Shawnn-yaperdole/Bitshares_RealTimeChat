import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

const getConversationBetween = async (userA, userB) => {
  return Conversation.findOne({
    participants: { $all: [userA, userB], $size: 2 },
  });
};

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        isVanishMessage: true,
        seenAt: null,
      },
      { seenAt: new Date() }
    );

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedFor: { $ne: myId },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const conversation = await getConversationBetween(senderId, receiverId);
    const isVanishMessage = conversation?.isVanishMode || false;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      isVanishMessage,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { deleteType } = req.query;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isParticipant = message.senderId.equals(userId) || message.receiverId.equals(userId);
    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (deleteType === "everyone") {
      if (!message.senderId.equals(userId)) {
        return res.status(403).json({ message: "Only the sender can delete for everyone." });
      }

      message.isDeletedForEveryone = true;
      message.text = "";
      message.image = undefined;
      await message.save();

      const otherUserId = message.receiverId;
      const receiverSocketId = getReceiverSocketId(otherUserId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", {
          messageId,
          deleteType: "everyone",
        });
      }

      return res.status(200).json({ message: "Message deleted for everyone.", data: message });
    }

    if (!message.deletedFor.some((id) => id.equals(userId))) {
      message.deletedFor.push(userId);
      await message.save();
    }

    res.status(200).json({ message: "Message deleted for you." });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: otherUserId } = req.params;
    const { deleteType } = req.query;

    if (deleteType === "everyone") {
      await Message.deleteMany({
        $or: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId },
        ],
      });

      const receiverSocketId = getReceiverSocketId(otherUserId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("chatDeleted", {
          chatPartnerId: myId,
          deleteType: "everyone",
        });
      }

      return res.status(200).json({ message: "Chat deleted for everyone." });
    }

    await Message.updateMany(
      {
        $or: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId },
        ],
        deletedFor: { $ne: myId },
      },
      { $push: { deletedFor: myId } }
    );

    res.status(200).json({ message: "Chat deleted for you." });
  } catch (error) {
    console.log("Error in deleteChat controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getVanishMode = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: otherUserId } = req.params;

    const conversation = await getConversationBetween(myId, otherUserId);
    res.status(200).json({ isVanishMode: conversation?.isVanishMode || false });
  } catch (error) {
    console.log("Error in getVanishMode controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleVanishMode = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: otherUserId } = req.params;

    let conversation = await getConversationBetween(myId, otherUserId);
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [myId, otherUserId],
        isVanishMode: true,
      });
    } else {
      conversation.isVanishMode = !conversation.isVanishMode;
      await conversation.save();
    }

    const receiverSocketId = getReceiverSocketId(otherUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("vanishModeToggled", {
        chatPartnerId: myId,
        isVanishMode: conversation.isVanishMode,
      });
    }

    res.status(200).json({ isVanishMode: conversation.isVanishMode });
  } catch (error) {
    console.log("Error in toggleVanishMode controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const leaveVanishChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: otherUserId } = req.params;

    const messagesToDelete = await Message.find({
      senderId: otherUserId,
      receiverId: myId,
      isVanishMessage: true,
      seenAt: { $ne: null },
    }).select("_id");

    const idsToDelete = messagesToDelete.map((m) => m._id);

    if (idsToDelete.length > 0) {
      await Message.deleteMany({ _id: { $in: idsToDelete } });

      const otherSocketId = getReceiverSocketId(otherUserId);
      if (otherSocketId) {
        io.to(otherSocketId).emit("vanishMessagesDeleted", {
          messageIds: idsToDelete,
          chatPartnerId: myId,
        });
      }
    }

    res.status(200).json({ deletedCount: idsToDelete.length });
  } catch (error) {
    console.log("Error in leaveVanishChat controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};