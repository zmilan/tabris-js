import NativeObject from '../NativeObject';
import Composite from './Composite';
import Tab from './Tab';
import {hint} from '../Console';

export default class TabFolder extends Composite {

  get _nativeType() {
    return 'tabris.TabFolder';
  }

  _initLayout() {
    this._layout = null;
  }

  _acceptChild(child) {
    return child instanceof Tab;
  }

  _addChild(child, index) {
    super._addChild(child, index);
    if (this.$children.indexOf(child) === 0) {
      child.$trigger('appear');
      this.$previousSelection = child;
    }
  }

  _removeChild(child) {
    if (!this._inDispose) {
      const childIndex = this.$children.indexOf(child);
      const rightNeighbor = this.$children[childIndex + 1];
      const leftNeighbor = this.$children[childIndex - 1];
      const newSelection = rightNeighbor || leftNeighbor;
      if (newSelection) {
        this.selection = newSelection;
      } else {
        this._triggerChangeEvent('selection', null);
      }
    }
    super._removeChild(child);
  }

  _trigger(name, event) {
    if (name === 'select') {
      const selection = tabris._nativeObjectRegistry.find(event.selection);
      return super._trigger('select', {selection});
    }
    if (name === 'scroll') {
      const selection = event.selection ? tabris._nativeObjectRegistry.find(event.selection) : null;
      return super._trigger('scroll', {selection, offset: event.offset});
    }
    return super._trigger(name, event);
  }

  _triggerChangeEvent(name, value) {
    if (name === 'selection') {
      if (this.$previousSelection !== value) {
        super._triggerChangeEvent(name, value);
        if (this.$previousSelection) {
          this.$previousSelection._trigger('disappear');
        }
        if (value) {
          value._trigger('appear');
        }
        this.$previousSelection = value;
      }
    } else {
      super._triggerChangeEvent(name, value);
    }
  }

  _getXMLAttributes() {
    const tab = this.selection;
    return super._getXMLAttributes().concat([
      ['selection', tab ? tab.toString() : '']
    ]);
  }

}

NativeObject.defineProperties(TabFolder.prototype, {
  paging: {type: 'boolean', default: false},
  tabBarLocation: {type: ['choice', ['top', 'bottom', 'hidden', 'auto']], default: 'auto', const: true},
  tabMode: {type: ['choice', ['fixed', 'scrollable']], default: 'fixed', const: true},
  selection: {
    set(name, tab) {
      if (this._children().indexOf(tab) < 0) {
        hint(this + ': Can not set selection to ' + tab);
        return;
      }
      if (this.selection === tab) {
        return;
      }
      this._nativeSet('selection', tab.cid);
      this._triggerChangeEvent('selection', tab);
    },
    get() {
      if (!this.$children.length) {
        return null;
      }
      const selection = this._nativeGet('selection');
      return selection ? tabris._nativeObjectRegistry.find(selection) : null;
    }
  },
  tabTintColor: {type: 'ColorValue'},
  selectedTabTintColor: {type: 'ColorValue'},
  tabBarBackground: {type: 'ColorValue'},
  tabBarElevation: {type: 'number', nocache: true},
  selectedTabIndicatorTintColor: {type: 'ColorValue'}
});

NativeObject.defineEvents(TabFolder.prototype, {
  scroll: {native: true},
  select: {native: true, changes: 'selection'}
});
