import { useEffect, useRef, useState } from "react";
import { MoreVerticalIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import ConfirmDialog from "./ConfirmDialog";

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser, deleteChat } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation();
    setPendingDeleteId(chatId);
    setOpenMenuId(null);
  };

  const confirmDelete = () => {
    deleteChat(pendingDeleteId, "me");
    setPendingDeleteId(null);
  };

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <>
      {chats.map((chat) => (
        <div
          key={chat._id}
          className="relative group bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => setSelectedUser(chat)}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`avatar ${onlineUsers.includes(chat._id) ? "online" : "offline"}`}>
                <div className="size-12 rounded-full">
                  <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} />
                </div>
              </div>
              <h4 className="text-slate-200 font-medium truncate">{chat.fullName}</h4>
            </div>

            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === chat._id ? null : chat._id);
                }}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <MoreVerticalIcon className="w-4 h-4" />
              </button>

              {openMenuId === chat._id && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-6 z-10 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 w-44"
                >
                  <button
                    onClick={(e) => handleDeleteClick(e, chat._id)}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                  >
                    Delete conversation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {pendingDeleteId && (
        <ConfirmDialog
          title="Delete conversation?"
          message="This will delete the conversation for you only. The other person will still see their copy."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </>
  );
}
export default ChatsList;