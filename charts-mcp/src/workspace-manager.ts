import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChartLibrary {
  id: string;
  name: string;
  instructions: string;
  cdnLinks: string[];
}

export class WorkspaceManager {
  private currentWorkspacePath: string | null = null;
  private readonly workspacesRoot: string;
  private readonly libraries: ChartLibrary[];

  constructor() {
    // Root folder for all workspaces (outside the charts-mcp folder)
    this.workspacesRoot = path.resolve(__dirname, '../../..', 'workspaces');
    
    this.libraries = [
      {
        id: 'amcharts',
        name: 'amCharts 5',
        instructions: `
Use amCharts 5 for data visualization. Key patterns:

1. Create root element:
   const root = am5.Root.new("chartdiv");

2. Apply dark theme:
   root.setThemes([am5themes_Animated.new(root)]);

3. Create chart (example XY chart):
   const chart = root.container.children.push(
     am5xy.XYChart.new(root, {
       panX: true,
       panY: true,
       wheelX: "panX",
       wheelY: "zoomX"
     })
   );

4. Add axes and series with your data.

5. Always dispose on cleanup:
   root.dispose();

Use modern ES6+ syntax. The HTML already includes all necessary CDN scripts.
        `.trim(),
        cdnLinks: [
          'https://cdn.amcharts.com/lib/5/index.js',
          'https://cdn.amcharts.com/lib/5/xy.js',
          'https://cdn.amcharts.com/lib/5/themes/Animated.js',
        ],
      },
      {
        id: 'chartjs',
        name: 'Chart.js',
        instructions: `
Use Chart.js for simple, responsive charts. Key patterns:

1. Get canvas context:
   const ctx = document.getElementById('chartCanvas').getContext('2d');

2. Create chart:
   const myChart = new Chart(ctx, {
     type: 'bar', // or 'line', 'pie', 'doughnut', etc.
     data: {
       labels: ['Red', 'Blue', 'Yellow'],
       datasets: [{
         label: 'My Dataset',
         data: [12, 19, 3],
         backgroundColor: ['rgba(255,99,132,0.2)', ...]
       }]
     },
     options: {
       responsive: true,
       plugins: {
         legend: { position: 'top' },
         title: { display: true, text: 'Chart Title' }
       }
     }
   });

3. Destroy on cleanup:
   myChart.destroy();
        `.trim(),
        cdnLinks: [
          'https://cdn.jsdelivr.net/npm/chart.js',
        ],
      },
    ];
  }

  getSupportedLibraries(): ChartLibrary[] {
    return this.libraries;
  }

  async initializeWorkspace(chartLibId: string): Promise<string> {
    const library = this.libraries.find(lib => lib.id === chartLibId);
    
    if (!library) {
      throw new Error(`Unsupported chart library: ${chartLibId}. Supported: ${this.libraries.map(l => l.id).join(', ')}`);
    }

    // Create workspace folder with timestamp
    const timestamp = Date.now();
    const workspaceName = `${chartLibId}-${timestamp}`;
    const workspacePath = path.join(this.workspacesRoot, workspaceName);

    await fs.mkdir(workspacePath, { recursive: true });

    // Create index.html
    const htmlContent = this.generateHTMLTemplate(library);
    await fs.writeFile(path.join(workspacePath, 'index.html'), htmlContent, 'utf-8');

    // Create placeholder chart.js
    const jsContent = this.generateJSPlaceholder(library);
    await fs.writeFile(path.join(workspacePath, 'chart.js'), jsContent, 'utf-8');

    // Create README with instructions
    const readmeContent = this.generateReadme(library, workspacePath);
    await fs.writeFile(path.join(workspacePath, 'README.md'), readmeContent, 'utf-8');

    this.currentWorkspacePath = workspacePath;
    
    return workspacePath;
  }

  getCurrentWorkspacePath(): string | null {
    return this.currentWorkspacePath;
  }

  private generateHTMLTemplate(library: ChartLibrary): string {
    const cdnScripts = library.cdnLinks
      .map(link => `  <script src="${link}"></script>`)
      .join('\n');

    const chartContainer = library.id === 'amcharts' 
      ? '<div id="chartdiv" style="width: 100%; height: 500px;"></div>'
      : '<canvas id="chartCanvas"></canvas>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${library.name} Chart</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      padding: 20px;
    }
    
    #status {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 8px 16px;
      background: #4CAF50;
      color: white;
      border-radius: 6px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 1000;
      transition: all 0.3s ease;
    }
    
    h1 {
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: 600;
    }
    
    #chartdiv, #chartCanvas {
      background: #1a1a1a;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <div id="status">● Connected</div>
  <h1>${library.name} Visualization</h1>
  ${chartContainer}

  <!-- CDN Scripts -->
${cdnScripts}

  <!-- Your Chart Code -->
  <script src="chart.js"></script>

  <!-- Live Reload via SSE -->
  <script>
    const statusEl = document.getElementById('status');
    const eventSource = new EventSource('/events');
    
    eventSource.onmessage = (event) => {
      if (event.data === 'reload') {
        statusEl.textContent = '↻ Reloading...';
        statusEl.style.background = '#FF9800';
        setTimeout(() => location.reload(), 100);
      }
    };
    
    eventSource.onerror = () => {
      statusEl.textContent = '● Disconnected';
      statusEl.style.background = '#f44336';
      setTimeout(() => {
        eventSource.close();
        location.reload();
      }, 2000);
    };
    
    eventSource.onopen = () => {
      statusEl.textContent = '● Connected';
      statusEl.style.background = '#4CAF50';
    };
  </script>
</body>
</html>`;
  }

  private generateJSPlaceholder(library: ChartLibrary): string {
    if (library.id === 'amcharts') {
      return `// amCharts 5 Example
// Create root element
const root = am5.Root.new("chartdiv");

// Set themes
root.setThemes([
  am5themes_Animated.new(root)
]);

// Create chart
const chart = root.container.children.push(
  am5xy.XYChart.new(root, {
    panX: true,
    panY: true,
    wheelX: "panX",
    wheelY: "zoomX"
  })
);

// Add cursor
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
cursor.lineY.set("visible", false);

// Create axes
const xAxis = chart.xAxes.push(
  am5xy.CategoryAxis.new(root, {
    categoryField: "category",
    renderer: am5xy.AxisRendererX.new(root, {
      minGridDistance: 30
    })
  })
);

const yAxis = chart.yAxes.push(
  am5xy.ValueAxis.new(root, {
    renderer: am5xy.AxisRendererY.new(root, {})
  })
);

// Add series
const series = chart.series.push(
  am5xy.ColumnSeries.new(root, {
    name: "Series",
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: "value",
    categoryXField: "category"
  })
);

// Sample data
const data = [
  { category: "A", value: 100 },
  { category: "B", value: 200 },
  { category: "C", value: 150 },
  { category: "D", value: 300 }
];

xAxis.data.setAll(data);
series.data.setAll(data);

// Make stuff animate on load
series.appear(1000);
chart.appear(1000, 100);`;
    } else if (library.id === 'chartjs') {
      return `// Chart.js Example
const ctx = document.getElementById('chartCanvas').getContext('2d');

const myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [{
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sample Chart'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});`;
    }

    return `// Chart code here\nconsole.log('Initialize your chart');`;
  }

  private generateReadme(library: ChartLibrary, workspacePath: string): string {
    return `# ${library.name} Workspace

**Workspace Path:** \`${workspacePath}\`

## Files

- \`index.html\` - Main HTML file with live reload
- \`chart.js\` - Your chart implementation
- \`README.md\` - This file

## Instructions

${library.instructions}

## Development

1. The workspace is served at http://localhost:3000
2. Edit \`chart.js\` to modify the chart
3. Changes trigger automatic reload via SSE

## Library Documentation

- ${library.name}: ${library.cdnLinks[0]}
`;
  }
}