// Total Revenue by Product (Jan-Apr 2024)
const totalRevenue = {
  'Laptop': 205000,    // 45000 + 52000 + 48000 + 60000
  'Mouse': 7800,       // 1500 + 1800 + 2100 + 2400
  'Keyboard': 13800    // 3000 + 3300 + 3600 + 3900
};

const ctx = document.getElementById('chartCanvas').getContext('2d');

const myChart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ['Laptop', 'Mouse', 'Keyboard'],
    datasets: [{
      label: 'Total Revenue',
      data: [
        totalRevenue['Laptop'],
        totalRevenue['Mouse'],
        totalRevenue['Keyboard']
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',   // Blue for Laptop
        'rgba(255, 99, 132, 0.8)',   // Red for Mouse
        'rgba(255, 206, 86, 0.8)'    // Yellow for Keyboard
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#ffffff',
          font: {
            size: 14
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Total Revenue Distribution by Product (Jan-Apr 2024)',
        color: '#ffffff',
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  }
});
