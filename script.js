document.addEventListener('DOMContentLoaded', async function() {
    // Fetch creator info
    try {
        const creator = await window.websim.getCreator();
        
        // Update profile with creator info
        if (creator) {
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
            
            // Fetch user stats
            try {
                const statsResponse = await fetch(`/api/v1/users/${creator.username}/stats`);
                const statsData = await statsResponse.json();
                
                if (statsData && statsData.stats) {
                    document.getElementById('total-likes').textContent = statsData.stats.total_likes.toLocaleString();
                    document.getElementById('total-views').textContent = statsData.stats.total_views.toLocaleString();
                }
            } catch (error) {
                console.error('Error fetching user stats:', error);
            }
            
            // Fetch user followers count
            try {
                const followersResponse = await fetch(`/api/v1/users/${creator.username}/followers?count=true`);
                const followersData = await followersResponse.json();
                
                if (followersData && followersData.followers && followersData.followers.meta && followersData.followers.meta.count !== null) {
                    document.getElementById('total-followers').textContent = followersData.followers.meta.count.toLocaleString();
                }
            } catch (error) {
                console.error('Error fetching followers:', error);
            }
            
            // Fetch projects
            try {
                const projectsResponse = await fetch(`/api/v1/users/${creator.username}/projects?posted=true`);
                const projectsData = await projectsResponse.json();
                
                if (projectsData && projectsData.projects && projectsData.projects.data) {
                    renderProjects(projectsData.projects.data);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
                document.getElementById('projects-container').innerHTML = 
                    '<div class="error-message">Unable to load projects at this time.</div>';
            }
        }
    } catch (error) {
        console.error('Error fetching creator info:', error);
        document.getElementById('creator-name').textContent = 'Digital Canvas Creator';
        document.getElementById('creator-description').textContent = 
            'Creator of the Digital Canvas drawing application';
    }
    
    // Function to render projects
    function renderProjects(projects) {
        const projectsContainer = document.getElementById('projects-container');
        
        if (projects.length === 0) {
            projectsContainer.innerHTML = '<div class="no-projects">No projects to display yet.</div>';
            return;
        }
        
        projectsContainer.innerHTML = '';
        
        projects.forEach(projectData => {
            const project = projectData.project;
            const site = projectData.site;
            
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            // Project image
            const imageUrl = site ? 
                `https://images.websim.com/v1/site/${site.id}/600` : 
                'brush-icon.png';
            
            projectCard.innerHTML = `
                <div class="project-image">
                    <img src="${imageUrl}" alt="${project.title || 'Project'}">
                </div>
                <div class="project-info">
                    <h3>${project.title || 'Untitled Project'}</h3>
                    <p>${project.description || 'No description'}</p>
                    <div class="project-stats">
                        <span><i class="stat-icon">👁️</i> ${project.stats.views}</span>
                        <span><i class="stat-icon">❤️</i> ${project.stats.likes}</span>
                    </div>
                </div>
            `;
            
            // Add link to project
            if (site) {
                projectCard.addEventListener('click', () => {
                    window.location.href = `https://websim.com/c/${site.id}`;
                });
                projectCard.style.cursor = 'pointer';
            }
            
            projectsContainer.appendChild(projectCard);
        });
    }

    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const colorBtns = document.querySelectorAll('.color-btn');
    const customColorInput = document.getElementById('custom-color');
    const brushSizeInput = document.getElementById('brush-size');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    
    // Set canvas size
    function resizeCanvas() {
        const containerWidth = canvas.parentElement.clientWidth;
        const containerHeight = window.innerHeight * 0.6;
        
        canvas.width = containerWidth > 1000 ? 1000 : containerWidth - 20;
        canvas.height = containerHeight > 600 ? 600 : containerHeight;
        
        // Restore canvas content after resize
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Initialize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Drawing state
    let isDrawing = false;
    let currentColor = '#000000';
    let currentSize = 10;
    
    // Event listeners for drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Color selection
    colorBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            currentColor = this.dataset.color;
            
            // Update active state
            colorBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update custom color input
            customColorInput.value = currentColor;
        });
    });
    
    // Custom color input
    customColorInput.addEventListener('input', function() {
        currentColor = this.value;
        
        // Remove active state from preset colors
        colorBtns.forEach(b => b.classList.remove('active'));
    });
    
    // Brush size
    brushSizeInput.addEventListener('input', function() {
        currentSize = this.value;
    });
    
    // Clear canvas
    clearBtn.addEventListener('click', function() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    
    // Save artwork
    saveBtn.addEventListener('click', function() {
        const link = document.createElement('a');
        link.download = 'my-artwork.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    
    // Drawing functions
    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const x = e.clientX - canvas.getBoundingClientRect().left;
        const y = e.clientY - canvas.getBoundingClientRect().top;
        
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentColor;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    function stopDrawing() {
        isDrawing = false;
        ctx.beginPath();
    }
    
    // Touch event handlers
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    }
    
    // Initialize canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});