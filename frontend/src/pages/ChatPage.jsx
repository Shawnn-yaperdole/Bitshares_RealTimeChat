import { useChatStore } from "../store/useChatStore";

import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();

  return (
    <div className="relative w-full h-full md:h-[min(800px,90dvh)] md:max-w-6xl overflow-hidden">
      <div className="relative w-full h-full flex overflow-hidden rounded-none md:rounded-2xl border-0 md:border border-slate-700/50">
        {/* LEFT SIDE - hidden on mobile once a chat is open */}
        <div
          className={`w-full md:w-80 h-full bg-slate-800/50 backdrop-blur-sm flex-col shrink-0 ${
            selectedUser ? "hidden md:flex" : "flex"
          }`}
        >
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE - hidden on mobile until a chat is open */}
        <div
          className={`w-full h-full flex-1 flex-col bg-slate-900/50 backdrop-blur-sm min-h-0 ${
            selectedUser ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </div>
    </div>
  );
}
export default ChatPage;