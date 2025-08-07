import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const { slug } = req.query;
      const post = await storage.getPostBySlug(slug as string);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const comments = await storage.getCommentsByPost(post.id);
      res.json(comments);
    } else if (req.method === 'POST') {
      const { insertCommentSchema } = await import('../../../shared/schema');
      const { slug } = req.query;
      const post = await storage.getPostBySlug(slug as string);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId: post.id
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Error handling comments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}