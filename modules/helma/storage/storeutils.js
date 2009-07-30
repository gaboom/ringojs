include('./storable');

export('equalKeys', 'updateEntity', 'getProps', 'getType', 'getKey', 'getId',
        'isEntity', 'isKey', 'createKey', 'isStorable', 'BaseTransaction');

function equalKeys(key1, key2) {
    return key1 && key2 && key1.$ref == key2.$ref;
}

function updateEntity(props, entity, txn) {
    if (txn.hasKey(entity._key)) {
        return false;
    } else {
        txn.registerKey(entity._key);
    }
    for (var i in props) {
        var value = props[i];
        if (isStorable(value)) {
            value.save(txn);
            value = value._key;
        } else if (value instanceof Array) {
            value = value.map(function(obj) {
                if (obj instanceof Storable) {
                    obj.save(txn);
                    return obj._key;
                } else {
                    return obj;
                }
            });
        }
        entity[i] = value;
    }
    return true;
}

function getProps(type, arg) {
    if (isEntity(arg)) {
        var props = {};
        for (var i in arg) {
            var value = arg[i];
            if (isKey(value)) {
                props[i] = new Storable(getType(value), value);
            } else if (value instanceof Array) {
                props[i] = value.map(function(obj) {
                    return isKey(obj) ?
                           new Storable(getType(obj), obj) : obj;
                });
            } else {
                props[i] = value;
            }
        }
        return props;
    } else if (!isKey(arg) && arg instanceof Object) {
        return arg;
    }
    return null;
}

function getKey(type, arg) {
    if (isEntity(arg)) {
        return arg._key;
    } else if (isKey(arg)) {
        return arg;
    }
    return null;
};

function getType(key) {
    if (isKey(key)) {
        var ref = key.$ref;
        return ref.substring(0, ref.indexOf(':'));
    }
    throw Error("Not a key: " + key);
}

function getId(key) {
    if (isKey(key)) {
        var ref = key.$ref;
        return ref.substring(ref.indexOf(':') + 1);
    }
    throw Error("Not a key: " + key);
}

function createKey(type, id) {
    return { $ref: type + ":" + id };
}

function isEntity(value) {
    return value instanceof Object
            && !isStorable(value)
            && isKey(value._key);
}

function isKey(value) {
    return value instanceof Object
           && typeof(value.$ref) === 'string';
}

function isStorable(value) {
    return value instanceof Storable;
}

function BaseTransaction() {

    var keys = new java.util.HashSet();

    this.registerKey = function(key) {
        keys.add(key.$ref);
    }

    this.hasKey = function(key) {
        return keys.contains(key.$ref);
    }
}