import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { PostsIndex } from '@/components/post-view'
import { getPosts } from '@/lib/content'

export const metadata: Metadata = { title: 'Posts & stories', description: 'Encouragement, teaching notes and stories from CKTV.' }

export default async function PostsPage() {
  const posts = await getPosts()
  return (
    <>
      <PageHero title="postspage.title" sub="postspage.sub" eyebrow="posts.eyebrow" />
      <PostsIndex posts={posts} />
    </>
  )
}
