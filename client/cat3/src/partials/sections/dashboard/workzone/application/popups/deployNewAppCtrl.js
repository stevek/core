/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2016
 */

(function(){
"use strict";
angular.module('workzone.application').controller('deployNewAppCtrl', ['items','$scope','$rootScope','$modal', '$modalInstance','workzoneServices','workzoneEnvironment', function(items,$scope,$rootScope,$modal,$modalInstance,workSvs,workEnvt) {
		/*$scope.isSelectedEnable = true;
		$scope.serverType='';
		console.log($scope.serverType);
		if($scope.serverType==='nexusServer' || $scope.serverType==='rldocker') {
			$scope.isSelectedEnable = false;
		}*/
		angular.extend($scope, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			},
			sucessMessage:false,
		});
		var depNewApp={
			newEnt:[],
			serverOptions:[],
			groupOptions:[],
			jobOptions:[],
			repositoryOptions:[],
			artifactsOptions:[],
			versionsOptions:[],
			tagOptions:[],
			deployResult:[]
			
		};
		depNewApp.init =function(){
			$scope.isLoadingServer=true;
			$scope.isLoadingJob=true;
			workSvs.repositoryServerList().then(function (serverResult) {
				$scope.isLoadingServer=false;
				depNewApp.serverOptions = serverResult.data.server;
			});
			depNewApp.getAllChefJobs();
		};
		depNewApp.getAllChefJobs =function () {
			// call job API
			workSvs.getChefJob().then(function (jobResult) {
				$scope.isLoadingJob=false;
				depNewApp.jobOptions = jobResult.data;
			});
		};
		depNewApp.getRepository= function(){
			if (depNewApp.newEnt.serverTypeInd){
				depNewApp.newEnt.serverType = depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].configType;
			} else {
				depNewApp.newEnt.serverType = '';
			}
			$scope.isLoadingNexus = true;
			if(depNewApp.newEnt.serverType === 'nexus'){
				// create group select box options
				angular.forEach(depNewApp.serverOptions,function(val){
					if(val.configType === depNewApp.newEnt.serverType){
						depNewApp.groupOptions = depNewApp.groupOptions.concat(val.groupid);
					}
				});
				workSvs.getNexusRepository(depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid).then(function (repositoryResult) {
					depNewApp.repositoryOptions = repositoryResult.data;
					$scope.isLoadingNexus = false;
				});
			} else {
				workSvs.getDockerRepository(depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid).then(function (repositoryResult) {
					$scope.isLoadingNexus = false;
					depNewApp.repositoryOptions = repositoryResult.data[0].repositories.docker;

				});
			}
			
			depNewApp.clearChildField('serverType');
		};
		depNewApp.changeRepository = function(){
			if(depNewApp.newEnt.serverType === 'docker') {
				var repository=depNewApp.newEnt.repositoryIMG.split('/');
				depNewApp.newEnt.repository=repository[0];
				depNewApp.newEnt.image=repository[1];
				$scope.isLoadingDocTag=true;
				var requestObject={
					dockerId:depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid,
					repository:depNewApp.newEnt.repository,
					image:depNewApp.newEnt.image
				}
				workSvs.getDockerImageTags(requestObject).then(function(tagResult){
					depNewApp.tagOptions = tagResult.data;
					$scope.isLoadingDocTag=false;
				});
			} else {
				depNewApp.newEnt.repository = depNewApp.repositoryOptions[depNewApp.newEnt.repositoryInd].id;
				depNewApp.newEnt.repositoryURL = depNewApp.repositoryOptions[depNewApp.newEnt.repositoryInd].resourceURI;
			}
			depNewApp.clearChildField('repository');
		};
		depNewApp.getArtifacts= function(){
			$scope.isLoadingArtifacts = true;
			depNewApp.requestData={
					nexus:depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid,
					repositories:depNewApp.newEnt.repository,
					group:depNewApp.newEnt.groupId
				}
			workSvs.getNexusArtifacts(depNewApp.requestData).then(function (artifactsResult) {
				depNewApp.artifactsOptions = artifactsResult.data;
				$scope.isLoadingArtifacts = false;
			});
			depNewApp.clearChildField('groupId');
		};
		depNewApp.getVersions= function(){
			$scope.isLoadingNexusVersion = true;
			depNewApp.newEnt.artifact = depNewApp.artifactsOptions[depNewApp.newEnt.artifactInd].artifactId;
			depNewApp.requestData.artifactId = depNewApp.artifactsOptions[depNewApp.newEnt.artifactInd].artifactId;
			workSvs.getNexusVersions(depNewApp.requestData).then(function (versionsResult) {
				depNewApp.versionsOptions = versionsResult.data;
				$scope.isLoadingNexusVersion = false;
			});
			depNewApp.clearChildField('artifact');
		};
		depNewApp.createNewJob = function (){
			$rootScope.$emit("CREATE_NEW_JOB");
			$rootScope.createChefJob=true;
		};
		depNewApp.clearChildField = function (field) {
			switch (field){
				case 'serverType' :
					depNewApp.newEnt.repository ='';
					depNewApp.newEnt.repositoryInd ='';
					depNewApp.newEnt.artifact ='';
					depNewApp.newEnt.groupId='';
					depNewApp.newEnt.artifactInd = '';
					depNewApp.newEnt.version ='';
					depNewApp.artifactsOptions=[];
					depNewApp.versionsOptions=[];
					depNewApp.tagOptions=[];
					depNewApp.newEnt.ContNameId='';
					depNewApp.newEnt.contPort='';
					depNewApp.newEnt.tag='';
					depNewApp.newEnt.repositoryIMG='';
					break;
				case 'repository' :
					depNewApp.newEnt.groupId='';
					depNewApp.newEnt.artifactInd = '';
					depNewApp.newEnt.artifact ='';
					depNewApp.newEnt.version ='';
					depNewApp.artifactsOptions=[];
					depNewApp.versionsOptions=[];
					depNewApp.tagOptions=[];
					depNewApp.newEnt.tag='';
					break;
				case 'groupId' :
					depNewApp.newEnt.artifactInd = '';
					depNewApp.newEnt.artifact ='';
					depNewApp.newEnt.version ='';
					depNewApp.versionsOptions=[];
					break;
				case 'artifact' :
					depNewApp.newEnt.version ='';
					break;
			}
		};
		depNewApp.submitAppDeploy = function (){
			if(depNewApp.newEnt.serverType === 'nexus'){
				var nexus={
					"repoURL":depNewApp.artifactsOptions[depNewApp.newEnt.artifactInd].resourceURI,
					"version": depNewApp.newEnt.version,
					"artifactId":depNewApp.artifactsOptions[depNewApp.newEnt.artifactInd].artifactId,
					"groupId": depNewApp.newEnt.groupId,
					"repository":depNewApp.newEnt.repository
				};
			} else{
				var docker={
					"image": depNewApp.newEnt.image,
					"containerName": depNewApp.newEnt.ContNameId,
					"containerPort": depNewApp.newEnt.contPort,
					"imageTag": depNewApp.newEnt.tag
				};
			}

			depNewApp.deploymentData ={
				"sourceData": {
				},
				"appData": {
					"projectId":workEnvt.getEnvParams().proj,
					"envName": workEnvt.getEnvParams().env,
					"appName": depNewApp.newEnt.repository,
					"version":depNewApp.newEnt.version
				},
				"task": {
					"taskId": depNewApp.jobOptions[depNewApp.newEnt.jobInd]._id,
					"nodeIds": depNewApp.jobOptions[depNewApp.newEnt.jobInd].taskConfig.nodeIds
				}

			}
			if(depNewApp.newEnt.serverType === 'nexus'){
				depNewApp.deploymentData.sourceData.nexus=nexus;
			}else{
				depNewApp.deploymentData.sourceData.nexus=docker;
			}
			$scope.isLoadingNewApp=true;
			workSvs.postAppDeploy(depNewApp.deploymentData).then(function(deployResult){
				$scope.isLoadingNewApp=false;
				$scope.sucessMessage=true;
				depNewApp.deployResult=deployResult.data;
			});
			//
		};
		depNewApp.ok=function(){
			$modalInstance.close();
			workSvs.runTask(depNewApp.deployResult.taskId).then(function(response) {
				$modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
					controller: 'orchestrationLogCtrl as orchLogCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return {
								taskId: depNewApp.deployResult.taskId,
								historyId: depNewApp.deployResult.historyId,
								taskType: depNewApp.deployResult.taskType
							};
						}
					}
				});
			});
		};
		// call job api after creating new job .
		$rootScope.$on("GET_ALL_TASK", function(){
			depNewApp.getAllChefJobs();
			$rootScope.createChefJob = false;
		});
		depNewApp.init();
		return depNewApp;
	}]);
})();