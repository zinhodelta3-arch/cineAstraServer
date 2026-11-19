import LegalDocument from '@/components/cinema/legal-document';
import { registrationDocuments } from '@/lib/auth/registration-documents.mjs';
import content from '@/lib/content/legal/privacidade.json';

export const metadata = { title: 'Política de Privacidade | CineAstra' };

export default function Page() {
  return <LegalDocument content={content} document={registrationDocuments.privacy} related={registrationDocuments.terms} />;
}
