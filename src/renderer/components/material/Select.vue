<template lang="pug">
  div(:class="$style.select")
    div(:class="$style.label" ref="dom_btn" @click="handleShow") {{value ? itemName ? list.find(l => l.id == value).name : value : ''}}
    ul(:class="$style.list" ref="dom_list" :style="listStyle")
      li(v-for="item in list" @click="handleClick(itemKey ? item[itemKey] : item)") {{itemName ? item[itemName] : item}}
</template>

<script>
// import { isChildren } from '../../utils'
export default {
  props: {
    list: {
      type: Array,
      default() {
        return []
      },
    },
    value: {
      type: [String, Number],
    },
    itemName: {
      type: String,
    },
    itemKey: {
      type: String,
    },
  },
  data() {
    return {
      show: false,
      listStyle: {
        height: 0,
        opacity: 0,
      },
    }
  },
  watch: {
    show(n) {
      this.$nextTick(() => {
        if (n) {
          this.listStyle.height = this.$refs.dom_list.scrollHeight + 'px'
          this.listStyle.opacity = 1
        } else {
          this.listStyle.height = 0
          this.listStyle.opacity = 0
        }
      })
    },
  },
  mounted() {
    document.addEventListener('click', this.handleHide)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleHide)
  },
  methods: {
    handleHide(e) {
      // if (e && e.target.parentNode != this.$refs.dom_list && this.show) return this.show = false
      if (e && e.target == this.$refs.dom_btn) return
      setTimeout(() => {
        this.show = false
      }, 50)
    },
    handleClick(item) {
      if (item === this.value) return
      this.$emit('input', item)
      this.$emit('change', item)
    },
    handleShow() {
      this.show = !this.show
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.select {
  font-size: 12px;
  position: relative;
}

.label {
  padding: 8px 15px;
  // background-color: @color-btn-background;
  transition: background-color @transition-theme;
  border-top: 2px solid @color-tab-border-bottom;
  border-left: 2px solid @color-tab-border-bottom;
  box-sizing: border-box;
  text-align: center;
  border-top-left-radius: 3px;
  color: @color-btn;
  cursor: pointer;

  &:hover {
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
  }
}

.list {
  position: absolute;
  top: 100%;
  left: 0;
  border-bottom: 2px solid @color-tab-border-bottom;
  border-left: 2px solid @color-tab-border-bottom;
  border-bottom-left-radius: 3px;
  background-color: @color-theme_2;
  overflow: hidden;
  opacity: 0;
  transition: .25s ease;
  transition-property: height, opacity;
  z-index: 10;

  li {
    cursor: pointer;
    padding: 8px 15px;
    // color: @color-btn;
    text-align: center;
    outline: none;
    transition: background-color @transition-theme;
    background-color: @color-btn-background;
    box-sizing: border-box;

    &:hover {
      background-color: @color-theme_2-hover;
    }
    &:active {
      background-color: @color-theme_2-active;
    }
  }
}


each(@themes, {
  :global(#container.@{value}) {
    .label {
      border-top-color: ~'@{color-@{value}-tab-border-bottom}';
      border-left-color: ~'@{color-@{value}-tab-border-bottom}';
      color: ~'@{color-@{value}-btn}';
      &:hover {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
    }

    .list {
      border-bottom-color: ~'@{color-@{value}-tab-border-bottom}';
      border-left-color: ~'@{color-@{value}-tab-border-bottom}';
      li {
        // color: ~'@{color-@{value}-btn}';
        background-color: ~'@{color-@{value}-btn-background}';
        &:hover {
          background-color: ~'@{color-@{value}-theme_2-hover}';
        }
        &:active {
          background-color: ~'@{color-@{value}-theme_2-active}';
        }
      }
    }
  }
})

</style>
