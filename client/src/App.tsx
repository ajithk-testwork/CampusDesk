
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import StudentRegistration from "./pages/StudentRegistration";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route
        path="/student-registration"
        element={<StudentRegistration />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
