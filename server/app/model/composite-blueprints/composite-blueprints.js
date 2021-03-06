/*
 Copyright [2016] [Relevance Lab]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var mongoose = require('mongoose');
var util = require('util');
var Schema = mongoose.Schema;

//@TODO Unique validation for name to be added
var CompositeBlueprintSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    organizationId: {
        type: String,
        required: true,
        trim: false
    },
    businessGroupId: {
        type: String,
        required: true,
        trim: false
    },
    projectId: {
        type: String,
        required: true,
        trim: false
    },
    blueprints: [{
        type: Schema.Types.Mixed,
        _id: false
    }],
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    }
});

CompositeBlueprintSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var compositeBlueprint = new self(data);
    compositeBlueprint.save(function (err, data) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, compositeBlueprint);
        }
    });
};

CompositeBlueprintSchema.statics.getById = function getById(compositeBlueprintId, callback) {
    this.find(
        {'_id': compositeBlueprintId, 'isDeleted': false },
        function(err, compositeBlueprints) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else if(compositeBlueprints && compositeBlueprints.length > 0) {
                return callback(null, compositeBlueprints[0]);
            } else {
                return callback(null, null);
            }
        }
    );
};

CompositeBlueprintSchema.statics.getAll
    = function getAll(query, callback) {
    query.isDeleted = false;

    this.find(query,
        function(err, compositeBlueprints) {
            if (err) {
                logger.error(err);
                return callback(err);
            } else {
                return callback(null, compositeBlueprints);
            }
        }
    );
};

var CompositeBlueprints = mongoose.model('compositeBlueprints', CompositeBlueprintSchema);
module.exports = CompositeBlueprints;