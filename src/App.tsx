import { Routes, Route } from "react-router-dom";
import { guests } from "./config/guests";
import InvitePage from "./routes/InvitePage";
import NotFound from "./routes/NotFound";

/** Routes are GENERATED from the guest config — never hand-written per guest. */
export default function App() {
  return (
    <Routes>
      {/* Root: a generic invitation with no personal name. */}
      <Route path="/" element={<InvitePage />} />

      {/* One route per guest, generated from src/config/guests.ts. */}
      {guests.map((g) => (
        <Route key={g.slug} path={`/${g.slug}`} element={<InvitePage slug={g.slug} />} />
      ))}

      {/* Unknown slug → graceful generic invitation / 404. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
