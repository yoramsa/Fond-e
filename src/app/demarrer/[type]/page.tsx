import { notFound } from "next/navigation";
import IntroView from "@/components/IntroView";
import { TYPES, TypeKey } from "@/lib/data";

export function generateStaticParams() {
  return Object.keys(TYPES).map((type) => ({ type }));
}

export default async function DemarrerTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!(type in TYPES)) notFound();
  return <IntroView type={type as TypeKey} />;
}
