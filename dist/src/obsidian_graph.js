// obsidian_graph.js — D3.js Force-Directed Graph for Obsidian Vault
// Fetches tree and raw markdown from GitHub to build nodes and edges.

const REPO_OWNER = 'can-ozyasar';
const REPO_NAME = 'MY_Paper_Library';
const BRANCH = 'main';
const TREE_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`;
const RAW_URL_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/`;

async function fetchVaultData() {
  try {
    // 1. Fetch file tree
    const treeRes = await fetch(TREE_API_URL);
    if (!treeRes.ok) throw new Error('Failed to fetch tree');
    const treeData = await treeRes.json();

    // 2. Filter Markdown files
    const mdFiles = treeData.tree.filter(file => file.type === 'blob' && file.path.endsWith('.md'));
    
    // 3. Prepare nodes
    const nodes = [];
    const nodeMap = new Map(); // id -> node

    // Add root node
    const rootNode = { id: 'Vault', group: 0, radius: 12, label: 'MY_Paper_Library' };
    nodes.push(rootNode);
    nodeMap.set(rootNode.id, rootNode);

    // Track edges
    const edges = [];

    // Helper to get pure filename without extension for Obsidian linking
    const getBaseName = (path) => {
      const parts = path.split('/');
      const filename = parts[parts.length - 1];
      return filename.replace('.md', '');
    };

    // Initialize all file nodes
    for (const file of mdFiles) {
      const id = getBaseName(file.path);
      let group = 1; // default
      if (file.path.includes('01_Makale')) group = 2; // Papers
      else if (file.path.includes('02_Kavram')) group = 3; // Concepts

      const node = { id, path: file.path, group, radius: 8, label: id };
      nodes.push(node);
      nodeMap.set(id, node);
      
      // Connect to root to ensure graph is weakly connected
      edges.push({ source: 'Vault', target: id, value: 1 });
    }

    // 4. Fetch contents and parse links (in parallel, max concurrency)
    // We only have ~14 files, so Promise.all is fine
    const fetchPromises = mdFiles.map(async (file) => {
      try {
        const rawRes = await fetch(RAW_URL_BASE + encodeURI(file.path));
        if (!rawRes.ok) return;
        const text = await rawRes.text();
        
        // Match [[Link]] or [[Link|Alias]]
        const linkRegex = /\[\[([^\]\|]+)(?:\|.*?)?\]\]/g;
        let match;
        const sourceId = getBaseName(file.path);

        while ((match = linkRegex.exec(text)) !== null) {
          const targetId = match[1].trim();
          
          // Connect if target exists in our vault
          if (nodeMap.has(targetId)) {
            edges.push({ source: sourceId, target: targetId, value: 2 });
            // Increase radius of target based on inbound links
            nodeMap.get(targetId).radius += 1;
          }
        }
      } catch (err) {
        console.warn('Failed fetching raw for', file.path, err);
      }
    });

    await Promise.all(fetchPromises);
    
    return { nodes, links: edges };

  } catch (error) {
    console.error('Error fetching vault data:', error);
    return null;
  }
}

function renderGraph(data) {
  console.log('renderGraph called with data:', data);
  if (!data || !data.nodes || !data.links) {
    console.warn('Graph data is invalid or empty');
    return;
  }

  const container = document.getElementById('obsidian-graph');
  if (!container) return;
  console.log('Container dimensions:', container.clientWidth, container.clientHeight);
  
  container.innerHTML = ''; // Clear loading/old data
  
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 500;

  if (typeof d3 === 'undefined') {
    console.error('d3 is not defined!');
    container.innerHTML = '<div style="color:red; padding: 20px;">Error: D3.js failed to load.</div>';
    return;
  }

  // Set colors for groups
  const color = d3.scaleOrdinal()
    .domain([0, 1, 2, 3])
    .range(['#2547C0', '#1A2733', '#0F7A5C', '#9C6B10']); // Root=accent, Default=white, Papers=greenish, Concepts=blueish

  // Force simulation
  const simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.links).id(d => d.id).distance(60))
    .force('charge', d3.forceManyBody().strength(-150))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(d => d.radius + 15).iterations(2));

  const svg = d3.select('#obsidian-graph')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', [0, 0, width, height]);
    
  // Add zoom
  const g = svg.append('g');
  svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.5, 4])
      .on('zoom', (e) => {
        g.attr('transform', e.transform);
      }));

  // Links
  const link = g.append('g')
    .attr('stroke', 'rgba(26,39,51,0.18)')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(data.links)
    .join('line')
    .attr('stroke-width', d => Math.sqrt(d.value));

  // Nodes
  const node = g.append('g')
    .attr('stroke', 'var(--bg)')
    .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(data.nodes)
    .join('circle')
    .attr('r', d => d.radius)
    .attr('fill', d => color(d.group))
    .call(drag(simulation));

  // Labels
  const label = g.append('g')
    .selectAll('text')
    .data(data.nodes)
    .join('text')
    .text(d => d.label)
    .attr('font-size', d => Math.min(14, d.radius + 4) + 'px')
    .attr('fill', 'var(--fg)')
    .style('opacity', 0.8)
    .attr('font-family', 'var(--mono)')
    .attr('dx', 12)
    .attr('dy', 4)
    .style('pointer-events', 'none');

  // Tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'graph-tooltip')
    .style('opacity', 0);

  node.on('mouseover', function(event, d) {
    d3.select(this).attr('stroke', '#2547C0').attr('stroke-width', 2);
    tooltip.transition().duration(200).style('opacity', .9);
    tooltip.html(d.label)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  })
  .on('mouseout', function(d) {
    d3.select(this).attr('stroke', '#f7f8f6').attr('stroke-width', 1.5);
    tooltip.transition().duration(500).style('opacity', 0);
  })
  .on('click', function(event, d) {
      if(d.path) {
          window.open(`https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${BRANCH}/${encodeURI(d.path)}`, '_blank');
      }
  });

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    label
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  });
}

function drag(simulation) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  return d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}

async function initGraph() {
  const container = document.getElementById('obsidian-graph');
  if (!container) return;
  
  container.innerHTML = '<div style="color: var(--fg-dim); padding: 20px; font-family: var(--mono); font-size: 12px;">Yükleniyor / Loading vault data...</div>';
  
  // Use IntersectionObserver to load graph only when visible
  const observer = new IntersectionObserver(async (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.disconnect();
        console.log('Graph container is visible, fetching data...');
        const data = await fetchVaultData();
        renderGraph(data);
        break;
      }
    }
  }, { threshold: 0.1 });
  
  observer.observe(container);
}

// Run init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGraph);
} else {
  initGraph();
}
