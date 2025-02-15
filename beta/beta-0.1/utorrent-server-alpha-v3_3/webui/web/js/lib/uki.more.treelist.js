uki.more = {};
uki.more.view = {};

// really basic tree list implementation
uki.more.view.treeList = {};

uki.view.declare('uki.more.view.TreeList', uki.view.List, function(Base) {
    this._setup = function() {
        Base._setup.call(this);
        this._render = new uki.more.view.treeList.Render();
    };
    
    this.listData = Base.data;

    this.data = uki.newProp('_treeData', function(v) {
        this._treeData = v;
        this._data = this._treeNodeToListData(v);
        var children = this.listData(), opened = false;
        for (var i=children.length - 1; i >= 0 ; i--) {
            if (this._data[i].__opened) {
                opened = true;
                this._openSubElement(i);
            }
        };
        this.listData(this._data);
        if (opened) this.trigger('open');
    });

    this._treeNodeToListData = function(node, indent) {
        indent = indent || 0;
        return uki.map(node, function(row) {
            row.__indent = indent;
            return row;
        });
    };

    this.toggle = function(index) {
        this._data[index].__opened ? this.close(index) : this.open(index);
    };
    
    function offsetFrom (array, from, offset) {
        for (var i = from; i < array.length; i++) {
            array[i] += offset;
        };
    }
    
    function recursiveLength (item) {
        var children = uki.attr(item, 'children'),
        length = children.length;

        for (var i=0; i < children.length; i++) {
            if (children[i].__opened) length += recursiveLength(children[i]);
        };
        return length;
    }    
    
    this._openSubElement = function(index) {
        var item = this._data[index],
            children = uki.attr(item, 'children');

        if (!children || !children.length) return 0;
        var length = children.length;
        
        item.__opened = true;
        this._data.splice.apply(this._data, [index+1, 0].concat( this._treeNodeToListData(children, item.__indent + 1) ));
        
        for (var i=children.length - 1; i >= 0 ; i--) {
            if (this._data[index+1+i].__opened) {
                length += this._openSubElement(index+1+i);
            }
        };
        return length;
    };

    this.open = function(index) {
        if (this._data[index].__opened) return this;
        
        var length = this._openSubElement(index),
            positionInSelection = uki.binarySearch(index, this._selectedIndexes),
            clickIndex = this._lastClickIndex,
            indexes = this._selectedIndexes;
            
        this.clearSelection(true);
        offsetFrom(
            indexes, 
            positionInSelection + (indexes[positionInSelection] == index ? 1 : 0), 
            length
        );
            
        this.listData(this._data);
        this.selectedIndexes(indexes);
        this._lastClickIndex = clickIndex > index ? clickIndex + length : clickIndex;
        this.trigger('open');
        return this;
    };
    
    this.close = function(index) {
        var item = this._data[index],
            indexes = this._selectedIndexes,
            children = uki.attr(item, 'children');
        if (!children || !children.length || !item.__opened) return;
            
        var length = recursiveLength(item);
        
        item.__opened = false;
        this._data.splice(index+1, length);
        
        var positionInSelection = uki.binarySearch(index, indexes),
            removeFrom = positionInSelection + (indexes[positionInSelection] == index ? 1 : 0),
            toRemove = 0,
            clickIndex = this._lastClickIndex;
        while (indexes[removeFrom + toRemove] && indexes[removeFrom + toRemove] <= index + length) toRemove++;
        
        this.clearSelection(true);
        offsetFrom(indexes, removeFrom, -length);
        if (toRemove > 0) {
            indexes.splice(positionInSelection, toRemove);
        }

        this.listData(this._data);
        this.selectedIndexes(indexes);
        this._lastClickIndex = clickIndex > index ? clickIndex - length : clickIndex;
        this.trigger('close');
    };
    
    this._mousedown = function(e) {
        if (e.target.className.indexOf('toggle-tree') > -1) {
            var o = uki.dom.offset(this._dom),
                y = e.pageY - o.y,
                p = y / this._rowHeight << 0;
            this.toggle(p);
        } else {
            Base._mousedown.call(this, e);
        }
    };

    this._keypress = function(e) {
        Base._keypress.call(this, e);
        e = e.domEvent;
        if (e.which == 39 || e.keyCode == 39) { // RIGHT
            this.open(this._lastClickIndex);
        } else if (e.which == 37 || e.keyCode == 37) { // LEFT
            this.close(this._lastClickIndex);
        }
    };

});
// tree list render
uki.more.view.treeList.Render = uki.newClass(uki.view.list.Render, new function() {
    this._parentTemplate = new uki.theme.Template(
        '<div class="${classPrefix}-row ${classPrefix}-${opened}" style="margin-left:${indent}px">' + 
            '<div class="${classPrefix}-toggle"><i class="toggle-tree"></i></div>${text}' +
        '</div>'
    );

    this._leafTemplate = new uki.theme.Template(
        '<div class="${classPrefix}-row" style="margin-left:${indent}px">${text}</div>'
    );
    
    this.initStyles = function() {
        this.classPrefix = 'treeList-' + uki.guid++;
        var style = new uki.theme.Template(
            '.${classPrefix}-row { color: #333; position:relative; padding-top:3px; } ' +
            '.${classPrefix}-toggle { overflow: hidden; position:absolute; left:-15px; top:5px; width: 10px; height:9px; } ' +
            '.${classPrefix}-toggle i { display: block; position:absolute; left: 0; top: 0; width:20px; height:18px; background: url(${imageSrc});} ' +
            '.${classPrefix}-selected { background: #3875D7; } ' +
            '.${classPrefix}-selected .${classPrefix}-row { color: #FFF; } ' +
            '.${classPrefix}-selected i { left: -10px; } ' +
            '.${classPrefix}-selected-blured { background: #CCCCCC; } ' +
            '.${classPrefix}-opened i { top: -9px; }'
        ).render({ 
            classPrefix: this.classPrefix, 
          imageSrc: config.static_prefix + '/images/expander-arrows.png'  // should call uki.image here
        });
        uki.dom.createStylesheet(style);
    };

    this.render = function(row, rect, i) {
        this.classPrefix || this.initStyles();
        var text = row.data,
            children = uki.attr(row, 'children');
        if (children && children.length) {
            return this._parentTemplate.render({ 
                text: text, 
                indent: row.__indent*18 + 22,
                classPrefix: this.classPrefix,
                opened: row.__opened ? 'opened' : ''
            });
        } else {
            return this._leafTemplate.render({ 
                text: text, 
                indent: row.__indent*18 + 22,
                classPrefix: this.classPrefix
            });
        }
    };
    
    this.setSelected = function(container, data, state, focus) {
        container.className = !state ? '' : focus ? this.classPrefix + '-selected' : this.classPrefix + '-selected-blured';
    };
});
