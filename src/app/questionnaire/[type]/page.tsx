import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuestionnaireWizard from "@/components/questionnaire/QuestionnaireWizard";
import { TYPES, TypeKey } from "@/lib/data";

export function generateStaticParams() {
  return Object.keys(TYPES).map((type) => ({ type }));
}

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!(type in TYPES)) notFound();

  return (
    <>
      <Header />
      <main>
        <QuestionnaireWizard type={type as TypeKey} />
      </main>
      <Footer />
    </>
  );
}
