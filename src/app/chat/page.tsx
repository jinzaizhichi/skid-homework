import ChatPage from "@/components/chat/page";
import RequireAiKey from "@/components/guards/RequireAiKey";

export default function ChatRoute() {
  return (
    <RequireAiKey fallback="/init">
      <ChatPage />
    </RequireAiKey>
  );
}
