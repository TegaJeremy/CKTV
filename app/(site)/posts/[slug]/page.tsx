import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PostView } from '@/components/post-view'
import { getPost, getPosts } from '@/lib/content'
import { optimizeImage } from '@/lib/media'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(decodeURIComponent((await params).slug))
  if (!post) return { title: 'Post not found' }
  const description = post.excerpt.en?.slice(0, 160) || post.body.en?.slice(0, 160)
  const image = post.cover ? optimizeImage(post.cover, 1200) : undefined
  return {
    title: post.title.en,
    description,
    openGraph: { title: post.title.en, description, type: 'article', images: image ? [{ url: image }] : undefined },
    twitter: { card: 'summary_large_image', title: post.title.en, description, images: image ? [image] : undefined },
  }
}

export default async function PostPage({ params }: Props) {
  const slug = decodeURIComponent((await params).slug)
  const [post, all] = await Promise.all([getPost(slug), getPosts()])
  if (!post) notFound()
  return <PostView post={post} more={all.filter((p) => p.slug !== post.slug).slice(0, 3)} />
}
