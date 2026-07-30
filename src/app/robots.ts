import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const runtime = 'edge';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isWow3d = host.includes('wow3dprinting.com') && !host.includes('.co.kr');
  
  const baseUrl = isWow3d ? 'https://wow3dprinting.com' : 'https://wow3dprinting.co.kr';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
