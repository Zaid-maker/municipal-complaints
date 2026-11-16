import { useState } from "react";

import StaffShell from "../components/StaffShell";
import StaffAccountsPage from "./StaffAccountsPage";
import StaffComplaintsPage from "./StaffComplaintsPage";

const TABS = [
  { id: "complaints", label: "Complaints" },
  { id: "accounts", label: "Staff accounts" }
];

export default function AdminApp() {
  const [tab, setTab] = useState("complaints");

  return (
    <StaffShell title="Staff console" tabs={TABS} active={tab} onChange={setTab}>
      {tab === "complaints" ? <StaffComplaintsPage /> : <StaffAccountsPage />}
    </StaffShell>
  );
}
