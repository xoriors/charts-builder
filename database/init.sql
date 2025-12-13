-- Sales data table
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,
    product TEXT NOT NULL,
    revenue DECIMAL(10, 2) NOT NULL,
    units_sold INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO sales (month, product, revenue, units_sold) VALUES
    ('2024-01', 'Laptop', 45000.00, 30),
    ('2024-01', 'Mouse', 1500.00, 150),
    ('2024-01', 'Keyboard', 3000.00, 100),
    ('2024-02', 'Laptop', 52000.00, 35),
    ('2024-02', 'Mouse', 1800.00, 180),
    ('2024-02', 'Keyboard', 3300.00, 110),
    ('2024-03', 'Laptop', 48000.00, 32),
    ('2024-03', 'Mouse', 2100.00, 210),
    ('2024-03', 'Keyboard', 3600.00, 120),
    ('2024-04', 'Laptop', 60000.00, 40),
    ('2024-04', 'Mouse', 2400.00, 240),
    ('2024-04', 'Keyboard', 3900.00, 130);

-- Employees performance table
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    performance_score INTEGER NOT NULL,
    sales_count INTEGER NOT NULL
);

INSERT INTO employees (name, department, performance_score, sales_count) VALUES
    ('Alice Johnson', 'Sales', 95, 45),
    ('Bob Smith', 'Sales', 88, 38),
    ('Carol White', 'Marketing', 92, 42),
    ('David Brown', 'Sales', 85, 35),
    ('Eve Davis', 'Marketing', 90, 40),
    ('Frank Miller', 'Sales', 78, 28);

-- Monthly revenue summary
CREATE TABLE IF NOT EXISTS monthly_revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_revenue DECIMAL(12, 2) NOT NULL,
    profit_margin DECIMAL(5, 2) NOT NULL
);

INSERT INTO monthly_revenue (year, month, total_revenue, profit_margin) VALUES
    (2024, 1, 125000.00, 22.5),
    (2024, 2, 145000.00, 24.3),
    (2024, 3, 138000.00, 23.1),
    (2024, 4, 165000.00, 26.8),
    (2024, 5, 152000.00, 25.2),
    (2024, 6, 178000.00, 28.1);