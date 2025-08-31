-- Migration to add expenses table for cost management
-- Expenses are tracked monthly with preset categories

-- Monthly expenses table - each row represents one category for one month
CREATE TABLE IF NOT EXISTS monthly_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('rent', 'salaries', 'utilities', 'supplies', 'marketing', 'insurance', 'maintenance', 'other') NOT NULL,
    month INT NOT NULL, -- 1-12
    year INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category_month_year (category, month, year)
);

-- Insert current month's preset categories with default amounts
SET @current_month = MONTH(CURDATE());
SET @current_year = YEAR(CURDATE());

INSERT INTO monthly_expenses (category, month, year, amount, notes) VALUES
('rent', @current_month, @current_year, 800.00, 'Loyer du salon'),
('salaries', @current_month, @current_year, 1500.00, 'Salaire employé'),
('utilities', @current_month, @current_year, 120.00, 'Électricité, eau, gaz'),
('supplies', @current_month, @current_year, 250.00, 'Produits de beauté'),
('marketing', @current_month, @current_year, 150.00, 'Publicité en ligne'),
('insurance', @current_month, @current_year, 80.00, 'Assurance professionnelle'),
('maintenance', @current_month, @current_year, 50.00, 'Entretien équipement'),
('other', @current_month, @current_year, 0.00, 'Autres dépenses')
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

-- Reset AUTO_INCREMENT if needed
ALTER TABLE monthly_expenses AUTO_INCREMENT = 1;

-- Add indexes for better performance
CREATE INDEX idx_monthly_expenses_month_year ON monthly_expenses(month, year);
CREATE INDEX idx_monthly_expenses_category ON monthly_expenses(category); 
