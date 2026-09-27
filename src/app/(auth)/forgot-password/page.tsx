import { ForgotForm } from "../AuthForms";

export const metadata = { title: "Reset your password | Meraki Creative" };

export default function ForgotPage() {
  return (
    <>
      <h1>Reset your password</h1>
      <p className="app-sub">Enter the email your account uses and we&apos;ll send a link to choose a new password.</p>
      <ForgotForm />
    </>
  );
}
