import { Landing } from '@/components/landing/landing';

const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';

export default function Home() {
  return <Landing demoEnabled={DEMO_ENABLED} />;
}
