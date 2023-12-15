const router = require('express').Router();

const adminUserListController = require('../../controllers/admin/adminUserListController');

router
	.route('/')
	.get(adminUserListController.getAllUsers)
	// .post(adminUserListController.setEncryptedPassword, adminUserListController.createUser);
	.post(adminUserListController.createUser);

//admin
router
	.route('/admin')
	.post(adminUserListController.createAdmin);

router
	.route('/mentors')
	.get(adminUserListController.getAllMentors)

router
	.route('/mentorsByStatus')
	.post(adminUserListController.getMentorsByActivationStatus)

router
	.route('/:id')
	.get(adminUserListController.getUser)
	.patch(adminUserListController.updateUser)
	.put(adminUserListController.updateUser)
	.delete(adminUserListController.deleteUser);

router.route('/count/data').get(adminUserListController.getAllUserCounter);
router.post('/updateUserStatus',adminUserListController.updateUserStatus);
router.post('/getUsersByName',adminUserListController.getUsersByName);
router.post('/getUsersByName1',adminUserListController.getUsersByName1);
router.post('/getUsersByName2',adminUserListController.getUsersByName2);
router.post('/getUsersByName3',adminUserListController.getUsersByName3);

module.exports = router;
