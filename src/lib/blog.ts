import { getCollection } from 'astro:content';
import { publishedPosts } from './blog-posts';
export const getPublishedPosts = async () => publishedPosts(await getCollection('blog'));
