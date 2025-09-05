-- Migration : Ajouter la table des dépenses
-- Date : 2025-08-31
-- Description : Créer la table des dépenses avec une colonne mois au lieu d'une table monthly_expenses séparée


-- Créer la table des dépenses
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    month INT NOT NULL,
    year INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category_month_year (category, month, year)
);

-- Insérer quelques catégories de dépenses par défaut pour le mois en cours
INSERT IGNORE INTO expenses (category, amount, month, year, notes) VALUES
('Loyer', 0, MONTH(NOW()), YEAR(NOW()), 'Loyer mensuel'),
('Services publics', 0, MONTH(NOW()), YEAR(NOW()), 'Électricité, eau, gaz'),
('Fournitures', 0, MONTH(NOW()), YEAR(NOW()), 'Fournitures et matériaux de beauté'),
('Marketing', 0, MONTH(NOW()), YEAR(NOW()), 'Publicité et promotions'),
('Assurance', 0, MONTH(NOW()), YEAR(NOW()), 'Assurance professionnelle'),
('Équipement', 0, MONTH(NOW()), YEAR(NOW()), 'Entretien et achats d\'équipement');

-- Afficher que la table a été créée avec succès
SELECT 'Table des dépenses créée avec succès' as Statut;