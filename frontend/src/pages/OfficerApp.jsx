import { useState } from "react";

import StaffShell from "../components/StaffShell";
import StaffComplaintsPage from "./StaffComplaintsPage";

const TABS = [
  { id: "mine", label: "My queue" },
  { id: "unassigned", label: "Unassigned" }
];

export default function OfficerApp() {
  const [tab, setTab] = useState("mine");

  return (
    <StaffShell title="Officer console" tabs={TABS} active={tab} onChange={setTab}>
      <StaffComplaintsPage key={tab} scope={tab} />
    </StaffShell>
  );
}
