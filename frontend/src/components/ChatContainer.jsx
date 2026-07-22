import { useEffect, useRef, useState } from "react";
import { MoreVerticalIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import ConfirmDialog from "./ConfirmDialog";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    leaveVanishChat,
    deleteMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
      leaveVanishChat(selectedUser._id);
    };
  }, [
    selectedUser,
    getMessagesByUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
    leaveVanishChat,
  ]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = (messageId, deleteType) => {
    if (deleteType === "everyone") {
      setPendingDeleteId(messageId);
      setOpenMenuId(null);
      return;
    }
    deleteMessage(messageId, "me");
    setOpenMenuId(null);
  };

  const confirmDeleteForEveryone = () => {
    deleteMessage(pendingDeleteId, "everyone");
    setPendingDeleteId(null);
  };

  const activeMessage = messages.find((m) => m._id === openMenuId);

  return (
    <>
      <ChatHeader />

      <div className="relative flex-1 flex flex-col min-h-0">
        {activeMessage && (
          <div className="absolute inset-0 flex items-center justify-center z-30 px-6 pointer-events-none">
            <div
              ref={menuRef}
              className="pointer-events-auto bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 w-48 max-w-[85vw]"
            >
              <button
                onClick={() => handleDelete(activeMessage._id, "me")}
                className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                Delete for me
              </button>
              {activeMessage.senderId === authUser._id && (
                <button
                  onClick={() => handleDelete(activeMessage._id, "everyone")}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                >
                  Delete for everyone
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 px-6 overflow-y-auto py-8">
          {messages.length > 0 && !isMessagesLoading ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => {
                const isOwnMessage = msg.senderId === authUser._id;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-end gap-1 max-w-[75%] group ${
                        isOwnMessage ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`chat-bubble relative ${
                          isOwnMessage ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-200"
                        }`}
                      >
                        {msg.isDeletedForEveryone ? (
                          <p className="italic text-sm opacity-60">This message was deleted</p>
                        ) : (
                          <>
                            {msg.image && (
                              <img
                                src={msg.image}
                                alt="Shared"
                                className="rounded-lg h-48 object-cover"
                              />
                            )}
                            {msg.text && <p className="mt-2">{msg.text}</p>}
                          </>
                        )}
                        <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                          {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {!msg.isDeletedForEveryone && !msg.isOptimistic && (
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === msg._id ? null : msg._id)
                          }
                          className="text-slate-400 hover:text-slate-200 p-1 mb-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVerticalIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messageEndRef} />
            </div>
          ) : isMessagesLoading ? (
            <MessagesLoadingSkeleton />
          ) : (
            <NoChatHistoryPlaceholder name={selectedUser.fullName} />
          )}
        </div>
      </div>

      <MessageInput />

      {pendingDeleteId && (
        <ConfirmDialog
          title="Delete for everyone?"
          message="This message will be removed for both you and the other person. This can't be undone."
          confirmLabel="Delete for everyone"
          onConfirm={confirmDeleteForEveryone}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </>
  );
}

export default ChatContainer;