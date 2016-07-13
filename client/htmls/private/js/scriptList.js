function setfilename(val){
    $('#fileNameDisplay').empty();
    var fileName = val.substr(val.lastIndexOf("\\")+1, val.length);
    $("#fileNameDisplay").append(fileName);
}

//calling the global track functionality when track params are available..
$(document).ready(function(e) {
    getScriptList();
});

//when the user clicks on the new button the setting the value to 'new' for the hidden field to know that user is creating the new item..
$('.addScriptItem').click(function(e) {
    $('#scriptForm').trigger('reset');
    $('#orgName').removeAttr('disabled');
    $('#scriptType').removeAttr('disabled');
    $('#orgName').val('');
    $('#fileNameDisplay').empty();
    $('.modal-header').find('.modal-title').html('Create New Script Item');
    $('#scriptEditHiddenInput').val('new');
    getOrganizationList();
    
});
//to list down the organization for creating the script item.
function getOrganizationList() {
    $.get('/d4dMasters/readmasterjsonnew/1', function(data) {
        var str = ' <option value="">Select Organization</option>',
        len = data.length;
        for (var i = 0; i < data.length; i++) {
            str = str + '<option value="' + data[i]._id + '">' + data[i].orgname + '</option>';
        }
        $('#orgName').html(str);
    })
}

//to show the focus on first input ....
$(document).on('shown.bs.modal', function(e) {
    $('[autofocus]', e.target).focus();
});


//form validation for dashboard save
var validator = $('#scriptForm').validate({
    rules: {
        trackUrl: {
            url: true
        }
    },
    onkeyup: false,
    errorClass: "error",
    errorPlacement: function(error, element) {
        var elem = $(element);
        if (element.parent('.input-groups').length) {
            error.insertBefore(element.parent());
        } else {
            if (element.parent('div.inputGroups')) {
                error.insertBefore('div.inputGroups');
            }
        }
    },
});
$('a.addScriptItem[type="reset"]').on('click', function(e) {
    validator.resetForm();
});

function getScriptList() {
    $('#scriptListTable').DataTable( {
        "processing": true,
        "serverSide": true,
        "destroy":true,
        "createdRow": function( row, data ) {
            $( row ).attr({"scriptId" : data._id,"scriptName":data.name,"scriptType":data.type, "scriptDesc" : data.description, "orgId" : data.orgDetails.id ,"orgName" : data.orgDetails.name,"scriptFileName" : data.fileDetails.name});
        },
        "ajax": '/scripts',
        "columns": [
            {"data": "name", "orderable" : true},
            {"data": "orgDetails.name" ,"orderable" : false },
            {"data": "type","orderable" : false  },
            {"data": "description" ,"orderable" : false },
            {"data": "","orderable" : true,
                "render": function (data) {
                    var $tdAction = '<div class="btn-group"><button class="btn btn-info pull-left btn-sg tableactionbutton editRowScriptItem" data-placement="top" value="Update" title="Edit"><i class="ace-icon fa fa-pencil bigger-120"></i></button></div>';
                    $tdAction = $tdAction + '<div style="margin-left:14px;" class="btn-group"><button class="btn btn-danger pull-left btn-sg tableactionbutton deleteScript" data-placement="top" value="Remove" title="Delete"><i class="ace-icon fa fa-trash-o bigger-120"></i></button></div>';
                    return $tdAction;
                }
            }
        ]
    } );
};

$('#scriptListTable tbody').on( 'click', 'button.editRowScriptItem', function(){
    var $this = $(this);
    var $tr = $(this).parents('tr.scriptItemRow');
    var $editModal = $('#modalForScriptEdit');
    $editModal.modal('show');
    $editModal.find('#scriptEditHiddenInput').val('edit');
    $editModal.find('h4.modal-title').html('Edit Script &nbsp;-&nbsp;&nbsp;' + $this.parents('tr').attr('scriptName'));
    $editModal.find('#scriptName').val($this.parents('tr').attr('scriptName'));
    $editModal.find('#scriptDescription').val($this.parents('tr').attr("scriptDesc"));
    $editModal.find('#orgName').empty().append('<option value="'+$this.parents('tr').attr("orgId")+'">'+$this.parents('tr').attr("orgName")+'</option>').attr('disabled','disabled');
    $editModal.find('#scriptType').val($this.parents('tr').attr('scriptType')).attr('disabled','disabled');
    $editModal.find('#scriptHiddenInputId').val($this.parents('tr').attr('scriptId'));
    $editModal.find('#fileNameDisplay').empty().append($this.parents('tr').attr('scriptFileName'));
    return false;
});

$('#scriptListTable tbody').on( 'click', 'button.deleteScript', function(){
    var $this = $(this);
    var $tr = $this.parents('tr.scriptItemRow');
    bootbox.confirm({
        message: 'Are you sure you want to Delete Script Item -&nbsp;' + $this.parents('tr').attr('scriptName') + '&nbsp;&nbsp;of Type-&nbsp;' + $this.parents('tr').attr('scriptType'),
        title: "Warning",
        callback: function(result) {
            if (result) {
                $.ajax({
                    url: '../scripts/' + $this.parents('tr').attr('scriptId'),
                    method: 'DELETE',
                    success: function() {
                        getScriptList();
                    },
                    error: function(jxhr) {
                        bootbox.alert(result);
                        var msg = "Unable to Delete URL please try again later";
                        if (jxhr.responseJSON && jxhr.responseJSON.message) {
                            msg = jxhr.responseJSON.message;
                        } else if (jxhr.responseText) {
                            msg = jxhr.responseText;
                        }
                        bootbox.alert(msg);
                    }
                });
            } else {
                return;
            }
        }
    });
    return false;
});


//save form for creating a new script item and updation of the script item(name, description etc)..
$('#scriptForm').submit(function(e) {
    var isValidator = $('#scriptForm').valid();
    if (!isValidator) {
        e.preventDefault();
        return false;
    } else {
        e.preventDefault();
        $('#saveItemSpinner').removeClass('hidden');
        var $form = $('#scriptForm');
        var scriptData = {};
        var $this = $(this);
        var name = $this.find('#scriptName').val().trim();
        var description = $this.find('#scriptDescription').val().trim();
        var type = $form.find('#scriptType').val();
        var orgId = $form.find('#orgName').val();
        var scriptEditNew = $(this).find('#scriptEditHiddenInput').val();
        var scriptId = $form.find('#scriptHiddenInputId').val();
        var orgName = $form.find('#orgName :selected').text();
        var fileNameDisplay = $form.find('#scriptFile').val();
        var availableFileName = $form.find('#fileNameDisplay').text();
        var orgDetails = {
            name: orgName,
            id: orgId
        }
        var url;
        var reqBody = {};
        var formData = new FormData();
        formData.append('file', $('input[type=file]')[0].files[0]);
        var methodName ='';
        $.ajax({
            method: "POST",
            url: '../scripts/uploadScript',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function(data, success) {
                var fileName = data.fileName;
                var fileDetails = {
                    id:fileName.split('_')[0],
                    name:fileName.split('_')[1],
                    path:data.filePath
                }
                if (scriptEditNew === 'edit') {
                    url = '../scripts/update/scriptData';
                    methodName = 'PUT';
                    reqBody = {
                        "scriptId": scriptId,
                        "name": name,
                        "type": type,
                        "description": description,
                        "orgDetails": orgDetails,
                        "fileDetails": fileDetails
                    };
                } else {
                    url = '../scripts/save/scriptData';
                    methodName = 'POST';
                    reqBody = {
                        "name": name,
                        "type": type,
                        "description": description,
                        "orgDetails": orgDetails,
                        "fileDetails": fileDetails
                    };
                }
                $.ajax({
                    method: methodName,
                    url: url,
                    data: reqBody,
                    success: function(data, success) {
                        $('#modalForScriptEdit').modal('hide');
                        $('#saveItemSpinner').addClass('hidden');
                        $('#saveBtnScript').removeAttr('disabled');
                        getScriptList();
                    },
                    error: function(jxhr) {
                        var msg = "Server Behaved Unexpectedly";
                        if (jxhr.responseJSON && jxhr.responseJSON.message) {
                            msg = jxhr.responseJSON.message;
                        } else if (jxhr.responseText) {
                            msg = jxhr.responseText;
                        }
                        bootbox.alert(msg);
                        $('#saveItemSpinner').addClass('hidden');
                        $('#saveBtnScript').removeAttr('disabled');
                    },
                    failure: function(jxhr) {
                        var msg = "Server Behaved Unexpectedly";
                        if (jxhr.responseJSON && jxhr.responseJSON.message) {
                            msg = jxhr.responseJSON.message;
                        } else if (jxhr.responseText) {
                            msg = jxhr.responseText;
                        }
                        bootbox.alert(msg);
                        $('#saveItemSpinner').addClass('hidden');
                        $('#saveBtnScript').removeAttr('disabled');
                    }
                });
            }
        });
        return false;
    }
});