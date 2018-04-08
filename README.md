## Trans Family Tree

* Draws a family tree in a descendant chart format (all descendants of an individual).
* NOW with separated spouse position
* Click on a node to expand/collapse all descendants.
* Drag around to navigate the tree
* Mouse wheel Or Touch pad scroll to zoom

Live site: [https://int3ractive.com/family-tree/](https://int3ractive.com/family-tree/)

### Getting Started

You have to run this from a server (can't just open the HTML file). The easiest way to do this, if you have python installed, is to run

```sh
# npm
$ npm start
# yarn
$ yarn start
```

this will start a live Node server at 0.0.0.0:8080 using `npx` and `live-server`

  - http://localhost:8080

The Tree is stored in author-friendly YAML format. Here's a template:

```yml
---
name: Tran Van A
gender: male
bio: Some biography description
image: url to image
spouse: Nguyen Thi B
children:
  - name: Tran Van X
    gender: male
    spouse: Pham Thi N
  - name: Tran Thi Y
    gender: female
```

### Colophon:

* Although this repo is fork from [Yakubovich/descendant_tree](https://github.com/Yakubovich/descendant_tree), I have completely rewritten the source based on this [D3 v4 version](https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd)
* D3 Version 4
* jQuery

### Limitations:

* Since this chart is based on D3 Tree layout, we can only display chart with single Root ancestor

## TODO:

- [X] Revise "spouse" display
- [ ] Search box which will highlight results instantaneously
- [ ] Bio overlay
- [ ] Auto-generated bio info from statistics (number of sons, daughters, grandchildren, in-laws...)
- [ ] Image attachment (in tree and bio)
- [ ] Highlight connection path of 2 chosen persons
- [ ] Calculate address (danh xưng) between 2 chosen person (cô - cháu, anh em họ, bà - cháu nội...)
- [ ] Enhance the theme and style
- [ ] Some quick highlight checkboxes:
    - [ ] Oldest sons
- [ ] Use 'book.html' algorithm to render semantic HTML beneath

