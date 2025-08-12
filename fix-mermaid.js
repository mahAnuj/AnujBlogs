// Quick script to fix malformed Mermaid blocks in existing posts

async function fixPost() {
  try {
    // Get the current post
    const response = await fetch('http://localhost:5000/api/posts/4d4b651e-d3d4-4533-af7e-bdf035371db2');
    const post = await response.json();
    
    // Fix the content
    let fixedContent = post.content;
    fixedContent = fixedContent.replace(/```mermaid\s*```mermaid/g, '```mermaid');
    fixedContent = fixedContent.replace(/```\s*```/g, '```');
    
    // Update the post
    const updateResponse = await fetch(`http://localhost:5000/api/posts/${post.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: fixedContent,
        status: 'published'
      })
    });
    
    const updatedPost = await updateResponse.json();
    console.log('Post fixed successfully!');
    console.log('Fixed Mermaid blocks in content');
    
  } catch (error) {
    console.error('Error fixing post:', error);
  }
}

fixPost();