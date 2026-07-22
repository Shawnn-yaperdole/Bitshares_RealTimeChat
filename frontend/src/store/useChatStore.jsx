import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isVanishMode: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: get().messages.filter((m) => m._id !== tempId).concat(res.data) });
    } catch (error) {
      set({ messages: get().messages.filter((m) => m._id !== tempId) });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  deleteMessage: async (messageId, deleteType) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}?deleteType=${deleteType}`);

      if (deleteType === "everyone") {
        set({
          messages: get().messages.map((m) =>
            m._id === messageId
              ? { ...m, isDeletedForEveryone: true, text: "", image: undefined }
              : m
          ),
        });
      } else {
        set({ messages: get().messages.filter((m) => m._id !== messageId) });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  deleteChat: async (userId, deleteType) => {
    try {
      await axiosInstance.delete(`/messages/chat/${userId}?deleteType=${deleteType}`);
      set({ chats: get().chats.filter((c) => c._id !== userId) });
      if (get().selectedUser?._id === userId) {
        set({ selectedUser: null, messages: [] });
      }
      toast.success("Chat deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete chat");
    }
  },

  getVanishMode: async (userId) => {
    try {
      const res = await axiosInstance.get(`/messages/vanish-mode/${userId}`);
      set({ isVanishMode: res.data.isVanishMode });
    } catch (error) {
      console.log("Error fetching vanish mode:", error);
    }
  },

  toggleVanishMode: async (userId) => {
    try {
      const res = await axiosInstance.patch(`/messages/vanish-mode/${userId}`);
      set({ isVanishMode: res.data.isVanishMode });
      toast.success(res.data.isVanishMode ? "Vanish mode enabled" : "Vanish mode disabled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle vanish mode");
    }
  },

  leaveVanishChat: async (userId) => {
    try {
      await axiosInstance.post(`/messages/vanish-leave/${userId}`);
    } catch (error) {
      console.log("Error leaving vanish chat:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      const currentMessages = get().messages;
      set({ messages: [...currentMessages, newMessage] });
    });

    socket.on("messageDeleted", ({ messageId, deleteType }) => {
      if (deleteType === "everyone") {
        set({
          messages: get().messages.map((m) =>
            m._id === messageId
              ? { ...m, isDeletedForEveryone: true, text: "", image: undefined }
              : m
          ),
        });
      }
    });

    socket.on("chatDeleted", ({ chatPartnerId }) => {
      if (get().selectedUser?._id === chatPartnerId) {
        set({ selectedUser: null, messages: [] });
      }
      set({ chats: get().chats.filter((c) => c._id !== chatPartnerId) });
    });

    socket.on("vanishModeToggled", ({ chatPartnerId, isVanishMode }) => {
      if (get().selectedUser?._id === chatPartnerId) {
        set({ isVanishMode });
        toast(isVanishMode ? "Vanish mode was turned on" : "Vanish mode was turned off");
      }
    });

    socket.on("vanishMessagesDeleted", ({ messageIds }) => {
      set({
        messages: get().messages.filter((m) => !messageIds.includes(m._id)),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("chatDeleted");
    socket.off("vanishModeToggled");
    socket.off("vanishMessagesDeleted");
  },
}));