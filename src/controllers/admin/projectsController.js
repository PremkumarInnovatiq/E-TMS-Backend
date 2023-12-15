import { projectPostServices, projectGetServices } from '../../services/projectServices';
import { emailType,sendEmail } from '../../utilities/emailHelper';
import userProjectWatchModel from '../../models/userProjectWatchlist';

// Load Modal
import Projects from '../../models/Projects';
import ProjectsFeesModel from '../../models/projectFees';
import userProjects from '../../models/userProjects';
import userModel from '../../models/User';
const { ObjectId } = require('bson');

// Load Helper
import { getQueryParams} from '../../utilities/helpers';

export async function index(req, res, next) {
	try { 
		console.log("req.query",req.query);
		const projects = await projectGetServices.getAll(req.query);
		res.status(200).json({
			status: 'success',
			message: 'projects retrieved successfully',
			data: projects
		});
	} catch (e) {
		next(e);
	}
}

export async function getStudentProject(req, res, next) {
	try { 
		
		const projects = await projectGetServices.getAllStudentProject(req.query);
		res.status(200).json({
			status: 'success',
			message: 'projects retrieved successfully',
			data: projects
		});
	} catch (e) {
		next(e);
	}
}

export async function getMentorProject(req, res, next) {
	try { 
		const projects = await projectGetServices.getMentorProjectWise(req.query);
		res.status(200).json({
			status: 'success',
			message: 'projects retrieved successfully',
			data: projects
		});
	} catch (e) {
		next(e);
	}
}

export async function add_ProjectFeesData(req, res, next) {
	let postData = req.body;

	const feeslins = new ProjectsFeesModel({
		title: postData.title, 
		fees_type: postData.fees_type,
		default_price: postData.default_price,
		maximum_price: postData.maximum_price,
		minimum_price: postData.minimum_price,
	});

	try
    {     
        const feesData = await feeslins.save();
        res.status(200).json({
			status: 'Success',
			message: 'Fees add successfully',
		});
    }
    catch(error)
    {
        next(error);
		res.status(400).json({
			status: 'error',
			message: 'Add Fees failed',
		});
    } 
}

export async function updateProjectFeesData(req, res, next) {
	let postData = req.body;
	try {
		let feeslins = {
			title: postData.title, 
			fees_type: postData.fees_type,
			default_price: postData.default_price,
			maximum_price: postData.maximum_price,
			minimum_price: postData.minimum_price,
		};
        let result = await ProjectsFeesModel.findOneAndUpdate(
            {_id: req.query.id},
            feeslins
        );
        res.status(200).json({
            status: 'Success',
            message: 'update Successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'update faild',
        });
    }
}

exports.getProjectPaymentData  = async (req, res) => {
	let postData = req.body;
	let where    = {_id: ObjectId(postData.id)};
	
	let Allaggregate = [ 
		{  
			$match: where,
		}, 
		{ $sort: { _id: -1 } },
		{
			$lookup:{
					from: 'users',
					localField: 'projectPaymentUser.userBy',
					foreignField: '_id',
					as: 'userdata'
			}
		},
		{    
			$project: { 
			  _id:1,
			  projectPaymentUser:1,
			  userdata: "$userdata"
			} 
		},  
	];

	var all_payment = await Projects.aggregate(
		Allaggregate
	);

	for (let i = 0; i < all_payment[0].projectPaymentUser.length; i++) {
		let userId = all_payment[0].projectPaymentUser[i].userBy.toString();
		let filterArray = all_payment[0].userdata.filter(
		  (x) => x._id.toString() === userId
		); 
		if (filterArray.length > 0) {
			all_payment[0].projectPaymentUser[i].userData = filterArray[0];
		}
	}

    try { 
        res.status(200).json({  
            status: "success",
            message: "retrieved data successfully",
            data: all_payment[0]
        });
    }catch (error) {
      	res.status(400).json({
			status: 'error',
			message: 'data fetch failed',
		});
    }
}

exports.UpdateStudentProjectStatus  = async (req, res) => {
	let postData = req.body;
	let obj;
	const projectData = await Projects.findOne({_id: postData.project_id});
	if(postData.status == 'active')
	{
		obj = {
			projectStatus: 'pending',
			// projectType: 'collegey',
			projectType: 'student',
			status: 1,
		} 
	}
	else
	{
		obj = {
			projectStatus: 'reject',
		}
	}

	let project_mailObj = {
		project_name : projectData.title,
		email: projectData.projectOwner.email,
	};

	const projectlins = new userProjects({
		project_id: postData.project_id, 
		user_id: projectData.projectOwner,
		status: 1,
	});
	
	try { 
        let result = await Projects.findOneAndUpdate(
            {_id: postData.project_id},
            obj
        );
		
		const userProjectData = await projectlins.save();

		if(postData.status == 'active')
		{
			sendEmail(emailType.STUDENT_PROJECT_APPOROVAL_EMAIL,project_mailObj);
		}
		else
		{
			sendEmail(emailType.STUDENT_PROJECT_REJECT_EMAIL,project_mailObj);
		}
		
		res.status(200).json({
			status: 'success',
			message: 'projects status update successfully',
			data: result
		});
    } catch (error) {
		//console.log("error",error);
        res.status(400).json({
			status: 'failed',
			message: 'projects status update failed',
		});
    }
}

exports.UpdateMentorProjectStatus  = async (req, res) => {
	let postData = req.body;
	let obj;
	const projectData = await Projects.findOne({_id: postData.project_id});
	if(postData.status == 'active')
	{
		obj = {
			//projectStatus: 'ongoing',
			projectStatus: 'pending',
			projectType: 'mentors',
			status: 1,
		} 
	}
	else
	{
		obj = {
			projectStatus: 'reject',
		}
	}

	let project_mailObj = {
		project_name : projectData.title,
		email: projectData.projectOwner.email,
	};
	
	const projectlins = new userProjects({
		project_id: postData.project_id, 
		user_id: projectData.mentor,
		status: 1,
	});
	
	try { 
        let result = await Projects.findOneAndUpdate(
            {_id: postData.project_id},
            obj
        );  
		if(postData.status == 'active')
		{ 
			const userProjectData = await projectlins.save();
			sendEmail(emailType.STUDENT_PROJECT_APPOROVAL_EMAIL,project_mailObj);
		}
		else
		{
			sendEmail(emailType.STUDENT_PROJECT_REJECT_EMAIL,project_mailObj);
		}
		
		res.status(200).json({
			status: 'success',
			message: 'projects status update successfully',
			data: result
		});
    } catch (error) {
		//console.log("error",error);
        res.status(400).json({
			status: 'faild',
			message: 'projects status update faild',
		});
    }
}

const _new = async function(req, res, next) {
	try {
		const project = await projectPostServices.saveRequest(req.body);
		res.status(200).json({
			status: 'success',
			message: 'project created successfully',
			data: project
		});
	} catch (e) {
		next(e);
	}
};
export { _new as new };

export async function edit(req, res, next) {
	try {
		console.log('-=-==->',req.body)
		req.body["projectPlan.projectDuration"]= req.body.projectDuration || null;
		req.body["projectPlan.week1Duration"]= req.body.week1Duration || null;
		req.body["projectPlan.week1DurationFile"]= req.body.week1DurationFile || null;
		req.body["projectPlan.week2Duration"]= req.body.week2Duration || null;
		req.body["projectPlan.week2DurationFile"]= req.body.week2DurationFile || null;
		req.body["projectPlan.week3Duration"]= req.body.week3Duration || null;
		req.body["projectPlan.week3DurationFile"]= req.body.week3DurationFile || null;
		req.body["projectPlan.week4Duration"]= req.body.week4Duration || null;
		req.body["projectPlan.week4DurationFile"]= req.body.week4DurationFile || null;
		req.body["projectPlan.week5Duration"]= req.body.week5Duration || null;
		req.body["projectPlan.week5DurationFile"]= req.body.week5DurationFile || null;
		req.body["projectPlan.week6Duration"]= req.body.week6Duration || null;
		req.body["projectPlan.week6DurationFile"]= req.body.week6DurationFile || null;
		req.body["projectPlan.monthDuration"]= req.body.monthDuration || null;

		const project = await projectPostServices.updateProject(req.body, req.params.id);
		if (project) {
			res.status(200).json({
				status: 'success',
				message: 'project updated successfully',
				data: project
			});
		}
	} catch (e) {
		next(e);
	}
}

export async function uploadFiles(req, res, next) {
  try {
    const project = await projectPostServices.uploadFiles(req);
    if (project) {
      res.status(200).json({
        status: 'success',
        message: 'project files updated successfully',
        data: project
      });
    }
  } catch (e) {
    next(e);
  }
}

const _delete = async function(req, res, next) {
	try {
		const project = await projectPostServices.deleteProject(req.params.id);
		if (project) {
			await userProjectWatchModel.deleteOne({ project_id: req.params.id });
			res.status(200).json({
				status: 'success',
				message: 'project deleted successfully'
			});
		}
	} catch (e) {
		next(e);
	}
};
export { _delete as delete };

export async function view(req, res, next) {
	try {
		const project = await projectGetServices.getOne(req.params.id);
		if (project) {
			res.status(200).json({
				status: 'success',
				message: 'project details',
				data: project
			});
		}
	} catch (e) {
		next(e);
	}
}
