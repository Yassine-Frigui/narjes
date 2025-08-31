-- Migration to add expenses table for cost management
-- Run this after the influencer tables migration

-- Expenses table for tracking business costs
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category ENUM('rent', 'salaries', 'utilities', 'supplies', 'marketing', 'other') DEFAULT 'other',
    recurring BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert some sample expenses
INSERT INTO expenses (name, amount, category, recurring, description) VALUES
('Loyer mensuel', 800.00, 'rent', TRUE, 'Loyer du salon de beauté'),
('Salaire employé', 1500.00, 'salaries', TRUE, 'Salaire mensuel de l\'esthéticienne'),
('Électricité', 120.00, 'utilities', TRUE, 'Facture d\'électricité mensuelle'),
('Fournitures cosmétiques', 300.00, 'supplies', TRUE, 'Produits de beauté et matériel'),
('Publicité Facebook', 150.00, 'marketing', TRUE, 'Campagnes publicitaires mensuelles');

-- Add index for better performance
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_recurring ON expenses(recurring);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);


delete from expenses where amount = 300.00 and name = 'Fournitures cosmétiques';


---*

reset the expenses id : 
