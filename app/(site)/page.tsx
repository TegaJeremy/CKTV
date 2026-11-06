import { HomeView } from '@/components/home-view'
import { getPosts, getSettings, getVideos } from '@/lib/content'

export default async function HomePage() {
  const [videos, posts, settings] = await Promise.all([getVideos(), getPosts(), getSettings()])
  return <HomeView videos={videos} posts={posts} settings={settings} />
}
