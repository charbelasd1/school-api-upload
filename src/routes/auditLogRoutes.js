const router = require('express').Router();
const h = require('../utils/asyncHandler');
const c = require('../controllers/auditLogController');

router.route('/').get(h(c.getLogs)).post(h(c.createLog));
router.get('/stats', h(c.getStats)); // must come before '/:id' so "stats" isn't treated as an id
router.route('/:id').get(h(c.getLogById)).put(h(c.updateLog)).delete(h(c.deleteLog));

module.exports = router;
