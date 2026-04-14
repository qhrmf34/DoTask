import { redirect } from 'next/navigation';

export default function CrewRootPage({ params }: { params: { crewId: string } }) {
  redirect(`/crews/${params.crewId}/board`);
}

