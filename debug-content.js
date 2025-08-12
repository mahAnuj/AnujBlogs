// Debug script to check draft post content
async function debugPost() {
  try {
    // Get the drafts
    const draftsResponse = await fetch('http://localhost:5000/api/posts/drafts');
    const drafts = await draftsResponse.json();
    
    console.log('Total drafts:', drafts.length);
    
    if (drafts.length > 0) {
      const firstDraft = drafts[0];
      console.log('First draft slug:', firstDraft.slug);
      console.log('First draft status:', firstDraft.status);
      console.log('First draft title:', firstDraft.title);
      console.log('Content preview:', firstDraft.content?.substring(0, 200));
      
      // Try to fetch by slug
      const postResponse = await fetch(`http://localhost:5000/api/posts/${firstDraft.slug}`);
      console.log('Fetch by slug status:', postResponse.status);
      
      if (postResponse.ok) {
        const post = await postResponse.json();
        console.log('Post found, checking markdown structure...');
        console.log('Has headings:', post.content.includes('## ') || post.content.includes('# '));
        console.log('Content start:', post.content.substring(0, 300));
      } else {
        console.log('Post not found by slug');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugPost();