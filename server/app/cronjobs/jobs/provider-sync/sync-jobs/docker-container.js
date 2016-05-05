


var logger = require('_pr/logger')(module);
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var credentialCrpto = require('_pr/lib/credentialcryptography.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var containerDao = require('_pr/model/container');
var SSH = require('_pr/lib/utils/sshexec');
var fileIo = require('_pr/lib/utils/fileio');
var ObjectId = require('mongoose').Types.ObjectId;
var async = require('async');
function sync() {
    var cmd = 'echo -e \"GET /containers/json?all=1 HTTP/1.0\r\n\" | sudo nc -U /var/run/docker.sock';
    async.waterfall([
        function(next){
            MasterUtils.getAllActiveOrg(next);
        },
        function(orgs,next){
            async.forEach(orgs,function(aOrg,next){
                MasterUtils.getBusinessGroupsByOrgId(aOrg.rowid,function(err,businessGroups){
                    if(err){
                        logger.error(err);
                        return;
                    };
                    async.forEach(businessGroups,function(aBusinessGroup,next) {
                        MasterUtils.getProjectsBybgId(aBusinessGroup.rowid, function(err, projects){
                            if(err){
                                logger.error(err);
                                return;
                            };
                            async.forEach(projects,function(aProject,next) {
                                MasterUtils.getEnvironmentsByprojectId(aProject.rowid,function(err,environments){
                                    if(err){
                                        logger.error(err);
                                        return;
                                    };
                                    async.forEach(environments,function(aEnvironment,next) {
                                        var jsonData={
                                            orgId:aOrg.rowid,
                                            bgId :aBusinessGroup.rowid,
                                            projectId:aProject.rowid,
                                            envId:aEnvironment.rowid
                                        };
                                        instancesDao.getInstancesByOrgBgProjectAndEnvId(jsonData,function(err,instances){
                                            if(err){
                                               logger.error(err);
                                               return;
                                            };
                                            async.forEach(instances,function(aInstance,next) {
                                                containerDao.deleteContainerByInstanceId(aInstance._id,function(err,data){
                                                    if(err){
                                                        logger.error(err);
                                                        return;
                                                    };
                                                    credentialCrpto.decryptCredential(aInstance.credentials, function (err, decryptedCredentials) {
                                                    if(err){
                                                       logger.error(err);
                                                       return;
                                                    };
                                                    var options = {
                                                        host: aInstance.instanceIP,
                                                        port: '22',
                                                        username: decryptedCredentials.username,
                                                        privateKey: decryptedCredentials.pemFileLocation,
                                                        password: decryptedCredentials.password
                                                    };
                                                    var sshParamObj = {
                                                        host: options.host,
                                                        port: options.port,
                                                        username: options.username
                                                    };
                                                    if (options.privateKey) {
                                                        sshParamObj.privateKey = options.privateKey;
                                                        if (options.passphrase) {
                                                            sshParamObj.passphrase = options.passphrase;
                                                        }
                                                    } else {
                                                        sshParamObj.password = options.password;
                                                    }
                                                    var sshConnection = new SSH(sshParamObj);
                                                    var stdOut = '';
                                                    sshConnection.exec(cmd, function (err, code) {
                                                        if(err){
                                                           logger.error(err);
                                                           return;
                                                        };
                                                        if (decryptedCredentials.pemFileLocation) {
                                                            fileIo.removeFile(decryptedCredentials.pemFileLocation, function () {
                                                                logger.debug('temp file deleted');
                                                            });

                                                        };
                                                        var _stdout = stdOut.split('\r\n');
                                                        var start = false;
                                                        var so = '';
                                                        _stdout.forEach(function(k, v) {
                                                            if (start == true) {
                                                                so += _stdout[v];
                                                                logger.debug(v + ':' + _stdout[v].length);
                                                            }
                                                            if (_stdout[v].length == 1)
                                                                start = true;
                                                            if (v >= _stdout.length - 1) {
                                                                if(so.indexOf("Names")>0){
                                                                    var containers = JSON.parse(so);
                                                                    async.forEach(containers,function(aContainer,next){
                                                                        var containerName=aContainer.Names.toString().replace('/','');
                                                                        var instanceId=aInstance._id.toString();
                                                                        var containerData = {
                                                                            orgId: aOrg.rowid,
                                                                            bgId: aBusinessGroup.rowid,
                                                                            projectId: aProject.rowid,
                                                                            envId: aEnvironment.rowid,
                                                                            Id: aContainer.Id,
                                                                            instanceIP: aInstance.instanceIP,
                                                                            instanceId: instanceId,
                                                                            Names: containerName,
                                                                            Image: aContainer.Image,
                                                                            ImageID: aContainer.ImageID,
                                                                            Command: aContainer.Command,
                                                                            Created: aContainer.Created,
                                                                            Ports: aContainer.Ports,
                                                                            Labels: aContainer.Labels,
                                                                            Status: aContainer.Status,
                                                                            HostConfig: aContainer.HostConfig
                                                                        };
                                                                        containerAction(containerData);
                                                                        containerData={};
                                                                    });
                                                                }
                                                            }
                                                        });

                                                    }, function (stdOutData) {
                                                        stdOut += stdOutData.toString();
                                                    }, function (stdOutErr) {
                                                        logger.error("Error hits to fetch docker details", stdOutErr);
                                                        return;
                                                    });
                                                    });
                                                })
                                            })
                                        })
                                    });
                                });
                            });
                        });
                    });
                });
            })
        }

    ],
        function (err, results) {
            if(err){
                logger.error(err);
                return;
            }

        });
};
function containerAction(aContainer){
    async.waterfall([
        function(next){
            containerDao.getContainerByIdInstanceId(aContainer.Id,aContainer.instanceId,next);
        },
        function(container,next){
            if(container.length === 0){
                containerDao.createContainer(aContainer,next);
            }else{
                containerDao.updateContainer(aContainer.Id,aContainer.Status,next);
            }
        }],
        function (err, results) {
            if(err){
                logger.error(err);
                return;
            }
        });
};

module.exports = sync;




