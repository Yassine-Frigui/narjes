const express = require('express');
const ServiceModel = require('../models/Service');
const { authenticateAdmin, requireRole } = require('../middleware/auth');
const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// ============================================================================
// BASIC SERVICE CRUD OPERATIONS
// ============================================================================

// Get all services (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { service_type, include_inactive } = req.query;
        const services = await ServiceModel.getAllServices(service_type, include_inactive === 'true');
        res.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get service by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const service = await ServiceModel.getServiceById(id);
        
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        res.json(service);
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new service
router.post('/', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const serviceData = req.body;
        
        // Validation for required fields
        const { nom, prix, duree, categorie_id, service_type = 'base' } = serviceData;
        if (!nom || !prix || !duree || !categorie_id) {
            return res.status(400).json({ 
                message: 'Name, price, duration and category are required' 
            });
        }

        const serviceId = await ServiceModel.createService(serviceData);
        const newService = await ServiceModel.getServiceById(serviceId);
        
        res.status(201).json({
            message: 'Service created successfully',
            service: newService
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update service
router.put('/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const serviceData = req.body;
        
        // Verify service exists
        const existingService = await ServiceModel.getServiceById(id);
        if (!existingService) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        await ServiceModel.updateService(id, serviceData);
        const updatedService = await ServiceModel.getServiceById(id);
        
        res.json({
            message: 'Service updated successfully',
            service: updatedService
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete service (soft delete)
router.delete('/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify service exists
        const existingService = await ServiceModel.getServiceById(id);
        if (!existingService) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        await ServiceModel.deleteService(id);
        
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ============================================================================
// SERVICE VARIANTS MANAGEMENT
// ============================================================================

// Get variants for a service
router.get('/:serviceId/variants', async (req, res) => {
    try {
        const { serviceId } = req.params;
        const variants = await ServiceModel.getServiceVariants(serviceId);
        res.json(variants);
    } catch (error) {
        console.error('Error fetching service variants:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new variant
router.post('/:serviceId/variants', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { nom, prix, description } = req.body;
        
        if (!nom || !prix) {
            return res.status(400).json({ 
                message: 'Name and price are required' 
            });
        }
        
        const variantData = {
            ...req.body,
            service_type: 'variant',
            parent_service_id: serviceId
        };
        
        const variantId = await ServiceModel.createService(variantData);
        const variant = await ServiceModel.getServiceById(variantId);
        
        res.status(201).json({
            message: 'Variant created successfully',
            variant
        });
    } catch (error) {
        console.error('Error creating variant:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ============================================================================
// SERVICE PACKAGES MANAGEMENT
// ============================================================================

// Get packages for a service
router.get('/:serviceId/packages', async (req, res) => {
    try {
        const { serviceId } = req.params;
        const packages = await ServiceModel.getServicePackages(serviceId);
        res.json(packages);
    } catch (error) {
        console.error('Error fetching service packages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new package
router.post('/:serviceId/packages', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { nom, nombre_sessions, prix, prix_par_session } = req.body;
        
        if (!nom || !nombre_sessions || !prix || !prix_par_session) {
            return res.status(400).json({ 
                message: 'Name, number of sessions, price and price per session are required' 
            });
        }
        
        const packageData = {
            ...req.body,
            service_type: 'package',
            parent_service_id: serviceId
        };
        
        const packageId = await ServiceModel.createService(packageData);
        const package = await ServiceModel.getServiceById(packageId);
        
        res.status(201).json({
            message: 'Package created successfully',
            package
        });
    } catch (error) {
        console.error('Error creating package:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ============================================================================
// SPECIALIZED SERVICE QUERIES
// ============================================================================

// Get base services only
router.get('/types/base', async (req, res) => {
    try {
        const services = await ServiceModel.getBaseServices();
        res.json(services);
    } catch (error) {
        console.error('Error fetching base services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get addon services only
router.get('/types/addons', async (req, res) => {
    try {
        const addons = await ServiceModel.getAddonServices();
        res.json(addons);
    } catch (error) {
        console.error('Error fetching addon services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get popular services
router.get('/popular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const services = await ServiceModel.getPopularServices(limit);
        res.json(services);
    } catch (error) {
        console.error('Error fetching popular services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get new services
router.get('/new', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 4;
        const services = await ServiceModel.getNewServices(limit);
        res.json(services);
    } catch (error) {
        console.error('Error fetching new services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get service with all its variants and packages
router.get('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const service = await ServiceModel.getServiceWithOptions(id);
        
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        res.json(service);
    } catch (error) {
        console.error('Error fetching service with options:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get services by category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const services = await ServiceModel.getServicesByCategory(categoryId);
        res.json(services);
    } catch (error) {
        console.error('Error fetching services by category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get services grouped by category
router.get('/grouped/by-category', async (req, res) => {
    try {
        const groupedServices = await ServiceModel.getServicesGroupedByCategory();
        res.json(groupedServices);
    } catch (error) {
        console.error('Error fetching grouped services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ============================================================================
// MULTILINGUAL TRANSLATION ROUTES
// ============================================================================

// Get service categories (for form dropdowns)
router.get('/categories', async (req, res) => {
    try {
        const categories = await ServiceModel.getCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get service with all translations
router.get('/:id/translations', async (req, res) => {
    try {
        const { id } = req.params;
        const serviceWithTranslations = await ServiceModel.getServiceWithTranslations(id);
        
        if (!serviceWithTranslations) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        res.json(serviceWithTranslations);
    } catch (error) {
        console.error('Error fetching service with translations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create service with translations
router.post('/with-translations', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const serviceData = req.body;
        
        // Validation for required fields
        const { translations, prix, duree, categorie_id } = serviceData;
        if (!translations?.fr?.nom || !prix || !duree || !categorie_id) {
            return res.status(400).json({ 
                message: 'French name, price, duration and category are required' 
            });
        }

        const serviceId = await ServiceModel.createServiceWithTranslations(serviceData);
        const newService = await ServiceModel.getServiceWithTranslations(serviceId);
        
        res.status(201).json({
            message: 'Service created successfully',
            service: newService
        });
    } catch (error) {
        console.error('Error creating service with translations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update service with translations
router.put('/:id/with-translations', requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const serviceData = req.body;
        
        // Verify service exists
        const existingService = await ServiceModel.getServiceById(id);
        if (!existingService) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        await ServiceModel.updateServiceWithTranslations(id, serviceData);
        const updatedService = await ServiceModel.getServiceWithTranslations(id);
        
        res.json({
            message: 'Service updated successfully',
            service: updatedService
        });
    } catch (error) {
        console.error('Error updating service with translations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
