import LegalDocument from '@/components/cinema/legal-document';
import { registrationDocuments } from '@/lib/auth/registration-documents.mjs';
import content from '@/lib/content/legal/termos.json';

export const metadata = { title: 'Termos de Uso | CineAstra' };

export default function Page() {
  return <LegalDocument content={content} document={registrationDocuments.terms} related={registrationDocuments.privacy} />;
}
