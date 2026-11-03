import { Header } from "@/components/header";
import Footer from "@/components/Footer";

export default function AuthLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
