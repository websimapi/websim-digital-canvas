document.addEventListener('DOMContentLoaded', async function() {
    // Fetch creator info
    try {
        // Get creator with proper null check
        const creator = await window.websim.getCreator();
        
        if (!creator) {
            // Fallback if creator is null
            console.warn('Creator information not available');
            document.getElementById('creator-name').textContent = 'Digital Canvas Creator';
            document.getElementById('creator-description').textContent = 
                'Creator of the Digital Canvas drawing application';
            return; // Exit early to avoid further null references
        }
        
        // Update profile with creator info
        document.getElementById('creator-name').textContent = '@' + creator.username;
        
        // Set avatar if available
        if (creator.avatar_url) {
            document.getElementById('creator-avatar').src = creator.avatar_url;
        }
        
        // Set description if available
        if (creator.description) {
            document.getElementById('creator-description').textContent = creator.description;
        } else {
            document.getElementById('creator-description').textContent = 'Digital artist and creator of Canvas drawing application';
        }
        
        // Fetch user stats with better error handling
        try {
            const statsResponse = await fetch(`/api/v1/users/${creator.username}/stats`);
            if (!statsResponse.ok) {
                throw new Error(`Stats API returned ${statsResponse.status}`);
            }
            const statsData = await statsResponse.json();
            
            if (statsData && statsData.stats) {
                document.getElementById('total-likes').textContent = statsData.stats.total_likes.toLocaleString();
                document.getElementById('total-views').textContent = statsData.stats.total_views.toLocaleString();
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
        
        // Fetch user followers count with better error handling
        try {
            const followersResponse = await fetch(`/api/v1/users/${creator.username}/followers?count=true`);
            if (!followersResponse.ok) {
                throw new Error(`Followers API returned ${followersResponse.status}`);
            }
            const followersData = await followersResponse.json();
            
            if (followersData && followersData.followers && followersData.followers.meta && 
                followersData.followers.meta.count !== null) {
                document.getElementById('total-followers').textContent = followersData.followers.meta.count.toLocaleString();
            }
        } catch (error) {
            console.error('Error fetching followers:', error);
        }
        
        // Fetch projects with better error handling
        try {
            const projectsResponse = await fetch(`/api/v1/users/${creator.username}/projects?posted=true`);
            if (!projectsResponse.ok) {
                throw new Error(`Projects API returned ${projectsResponse.status}`);
            }
            const projectsData = await projectsResponse.json();
            
            if (projectsData && projectsData.projects && projectsData.projects.data) {
                renderProjects(projectsData.projects.data);
            } else {
                document.getElementById('projects-container').innerHTML = 
                    '<div class="no-projects">No projects data available.</div>';
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            document.getElementById('projects-container').innerHTML = 
                '<div class="error-message">Unable to load projects at this time.</div>';
        }
    } catch (error) {
        console.error('Error fetching creator info:', error);
        document.getElementById('creator-name').textContent = 'Digital Canvas Creator';
        document.getElementById('creator-description').textContent = 
            'Creator of the Digital Canvas drawing application';
        document.getElementById('projects-container').innerHTML = 
            '<div class="error-message">Unable to load profile information at this time.</div>';
    }
    
    // Function to render projects
    function renderProjects(projects) {
        const projectsContainer = document.getElementById('projects-container');
        
        if (!projects || projects.length === 0) {
            projectsContainer.innerHTML = '<div class="no-projects">No projects to display yet.</div>';
            return;
        }
        
        projectsContainer.innerHTML = '';
        
        projects.forEach(projectData => {
            if (!projectData || !projectData.project) {
                console.warn('Invalid project data encountered:', projectData);
                return;
            }
            
            const project = projectData.project;
            const site = projectData.site;
            
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            // Project image with fallback
            const imageUrl = (site && site.id) ? 
                `https://images.websim.com/v1/site/${site.id}/600` : 
                'brush-icon.png';
            
            // Safely access project properties with fallbacks
            const title = project.title || 'Untitled Project';
            const description = project.description || 'No description';
            const views = (project.stats && project.stats.views !== undefined) ? project.stats.views : 0;
            const likes = (project.stats && project.stats.likes !== undefined) ? project.stats.likes : 0;
            
            projectCard.innerHTML = `
                <div class="project-image">
                    <img src="${imageUrl}" alt="${title}">
                </div>
                <div class="project-info">
                    <h3>${title}</h3>
                    <p>${description}</p>
                    <div class="project-stats">
                        <span><i class="stat-icon">👁️</i> ${views}</span>
                        <span><i class="stat-icon">❤️</i> ${likes}</span>
                    </div>
                </div>
            `;
            
            // Add link to project
            if (site && site.id) {
                projectCard.addEventListener('click', () => {
                    window.location.href = `https://websim.com/c/${site.id}`;
                });
                projectCard.style.cursor = 'pointer';
            }
            
            projectsContainer.appendChild(projectCard);
        });
    }
});