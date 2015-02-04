define(['../bower_components/d3/d3', 'delta/main'], function (d3, DeltaJS) {
    d3.domVisualizer = function(container, options, undefined) {
        options = options || {};
        this.d3TreeRoot = false;
        this.duration = options.duration || 500;
        this.nodeSize = options.nodeSize || [50, 80];
        this.autoIncrement = 0;
        this.fitToContainer = options.fitToContainer || true;
        this.displayTextNodes = options.displayTextNodes || true;
        this.displayTextIndentNodes = options.displayTextIndentNodes || false;
        this.displayCommentNodes = options.displayCommentNodes || false;
        this.tree = d3.layout.tree();
        this.container = (typeof container === 'string') ? document.querySelector(container) : container;

        if(this.fitToContainer) {
            // FIXME +43, -45 ?
            this.tree.size([this.container.clientWidth+43, this.container.clientHeight-45]);
        }
        else {
            this.tree.nodeSize(this.nodeSize);
        }

        this.diagonal = d3.svg.diagonal()
            .projection(function (d) {
                return [d.x, d.y];
            });
    };

    d3.domVisualizer.prototype.update = function(animate) {
        animate = animate || false;

        var nodes = this.tree.nodes(this.d3TreeRoot);

        var minX = d3.min(nodes, function(d) { return d.x; });
        var width = d3.max(nodes, function(d) { return d.x; }) -
            minX;

        var height = d3.max(nodes, function(d) { return d.y; }) -
            d3.min(nodes, function(d) { return d.y; });

        var svg = d3.select(this.container).select("svg");

        if(!svg[0][0]) {
            svg = d3.select(this.container).append("svg");
            svg.append("g");
        }
        var vis = svg.select('g');
        svg.attr({width: width+45, height: height+45});

        vis.attr("transform", "translate("+(-minX+20)+",30)");

        nodes.forEach(function(node) {
            if(!node.children) {
                node.children = [];
            }
        });

        // Select all nodes and syncs with d3TreeRoot
        var node = vis.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id;
            });

        var nodeCurrent = node;
        // Move existing nodes to their new position
        if (animate) {
            nodeCurrent = node.transition()
                .duration(this.duration);
        }
        nodeCurrent.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
            .style("opacity", 1)
            .select('text')
            .text(function (d) {
                return d.value;
            });

        // Add new nodes
        var nodeEnter = node.enter().append("svg:g")
            .attr("class", function (d) {
                return "node " + d.type;
            })
            .style("opacity", 0.5)
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .attr("transform", function (d) {

                var x = this.d3TreeRoot.x;
                var y = this.d3TreeRoot.y;
                var dTmp = d;
                while(dTmp.parent) {
                    if(dTmp.parent.x0 && dTmp.parent.y0) {
                        x = dTmp.parent.x0;
                        y = dTmp.parent.y0;
                        break;
                    }
                    dTmp = dTmp.parent;
                }

                return "translate(" + x + "," + y + ")";
            }.bind(this));

        // Add circle in nodes, radius 10px
        nodeEnter.append("svg:circle")
            .attr("r", 10)
            .style("stroke-width", "1.5px")
            .style("fill", function(d) {
                switch(d.type) {
                    case 'text':
                        return '#50b456';
                        break;
                    case 'text indent':
                        return '#ffcc00';
                        break;
                    case 'comment':
                        return '#9a5096';
                        break;
                    default:
                        return 'steelblue';
                        break;
                }
            })
            .style("stroke", function(d) {
                switch(d.type) {
                    case 'text':
                        return '#0d952c';
                        break;
                    case 'text indent':
                        return 'orange';
                        break;
                    case 'comment':
                        return 'purple';
                        break;
                    default:
                        return '#355E95';
                        break;
                }
            });

        // Add node name 5px above
        nodeEnter.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", -15)
            .text(function (d) {
                return d.value;
            });

        // Move new nodes to their position
        if (animate) {
            nodeEnter = nodeEnter.transition()
                .duration(this.duration);
        }
        nodeEnter.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
            .style("opacity", 1);

        // Remove old nodes
        node.exit().remove();

        // Select all links
        var link = vis.selectAll("path.link")
            .data(this.tree.links(nodes), function (d) {
                return d.target.id;
            });

        // Insert new links at the parent previous position
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var x = this.d3TreeRoot.x;
                var y = this.d3TreeRoot.y;
                var dTmp = d.source;
                while(dTmp) {
                    if(dTmp.x0 && dTmp.y0) {
                        x = dTmp.x0;
                        y = dTmp.y0;
                        break;
                    }
                    dTmp = dTmp.parent;
                }
                x = (d.source && d.source.x0) ? d.source.x0 : x;
                y = (d.source && d.source.y0) ? d.source.y0 : y;
                var o = {x: x, y: y};
                return this.diagonal({source: o, target: o});
            }.bind(this))
            .style("opacity", 0)
            .style("fill", "none")
            .style("stroke", "#ccc");

        // Transition links to their new position.
        if(animate) {
            link.transition()
                .duration(this.duration)
                .attr("d", this.diagonal)
                .style("opacity", 1);
        }
        else
        {
            link.attr("d", this.diagonal)
                .style("opacity", 1);
        }

        // Remove old links
        link.exit().remove();

        // Remember current position for future transitions
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

    };

    d3.domVisualizer.prototype.getRealNodeName = function (domNode) {
        var realNodeName = domNode.tagName.toLowerCase();

        if (domNode.hasAttribute("id")) {
            realNodeName += "#" + domNode.getAttribute("id");
        }
        else if (domNode.hasAttribute("class")) {
            [].forEach.call(domNode.className.split(" "), function (className) {
                realNodeName += "." + className;
            });
        }

        return realNodeName;
    };

    d3.domVisualizer.prototype.buildTree = function (domNode, depth) {
        var d3Node = new DeltaJS.tree.Node();
        d3Node.id = ++this.autoIncrement;
        d3Node.depth = depth || 0;

        switch (domNode.nodeType) {
            case Node.ELEMENT_NODE:
                d3Node.value = this.getRealNodeName(domNode);
                d3Node.type = "element";

                if (domNode.childNodes.length) {
                    [].forEach.call(domNode.childNodes, function (domChildNode) {
                        d3Node.append(this.buildTree(domChildNode, d3Node.depth+1));
                    }.bind(this));
                }

                break;
            case Node.TEXT_NODE:
                d3Node.value = "#text";
                d3Node.type = domNode.nodeValue.match(/^\s+$/) ? "text indent" : "text";

                break;
            case Node.COMMENT_NODE:
                d3Node.value = "<!-- -->";
                d3Node.type = "comment";

                break;
        }

        return d3Node;
    };

    d3.domVisualizer.prototype.parseHTML = function(htmlStr) {
        var doc = document.implementation.createHTMLDocument("");

        var domRoot;
        if (htmlStr.indexOf("<html") !== -1) {
            doc.documentElement.innerHTML = htmlStr;
            domRoot = doc.documentElement;
        }
        else if (htmlStr.indexOf("<body") !== -1) {
            doc.documentElement.innerHTML = htmlStr;
            domRoot = doc.body;
        }
        else {
            doc.body.innerHTML = htmlStr;
            domRoot = doc.body.firstElementChild;
        }

        var oldTree = null;
        if(this.d3TreeRoot) {
            oldTree = this.d3TreeRoot;
        }
        //html+head++meta++title+++text+body++h1+++text++div+++h2++++text+++p++++text
        //html+head++meta++title+++text+body++div+++h2++++text+++p++++text
        this.d3TreeRoot = this.buildTree(domRoot);
        if(oldTree) {
            var removes;
            var inserts;
            var updates;

            var xcc;


            inserts = [];
            removes = [];
            updates = [];


            // run xcc
            matching = new DeltaJS.tree.Matching();

            xcc = new DeltaJS.xcc.Diff(oldTree, this.d3TreeRoot);
            xcc.matchTrees(matching);

//            this.d3TreeRoot.forEach(function(node) {
//                if(!node.partner) {
//                    console.log(node);
//                }
//            });

            collector = new DeltaJS.delta.DeltaCollector(matching, oldTree, this.d3TreeRoot);
            collector.forEachChange(function(op) {
                switch (op.type) {
                    case DeltaJS.delta.UPDATE_NODE_TYPE:
                        updates = updates.concat(op.insert);
                        break;

                    case DeltaJS.delta.UPDATE_FOREST_TYPE:
                        if (op.remove.length > 0) {
                            removes= removes.concat(op.remove);
                        }

                        if (op.insert.length > 0) {
                            inserts = inserts.concat(op.insert);
                        }
                        break;
                }
            });

            removes.forEach(function(node) {
                node.parent.children.splice(node.childidx, 1);
                var idx = 0;
                node.parent.children.forEach(function(node) {
                    node.childidx = idx++;
                });
            });

            updates.forEach(function(node) {
                node.partner.value = node.value;
            });

            inserts.forEach(function(node) {
                node.parent.partner.children.splice(node.childidx, 0, node);
                node.parent = (node.parent.partner) ? node.parent.partner : node.parent;
                var idx = 0;
                node.parent.partner.children.forEach(function(node) {
                    node.childidx = idx++;
                });
            });

            this.d3TreeRoot = oldTree;

            this.d3TreeRoot.forEach(function(node) {
                if(node.partner) {
                    delete node.partner;
                }
            });

        }
//    this.addNodesByType("element");
//    this.addNodesByType("text");
//    this.addNodesByType("comment");
    };


    d3.domVisualizer.prototype.addNodesByType = function (type, node) {
        node = node || this.d3TreeRoot;

        if(typeof node._children !== "undefined") {
            node.children = node.children || [];

            var newNodes = node._children.filter(function (elt) {
                return elt.type === type;
            });

            var bisect = d3.bisector(function (a, b) {
                return a.id - b.id;
            }).right;

            newNodes.forEach(function (elt) {
                var pos = bisect(node.children, elt);
                node.children.splice(pos, 0, elt);
            });

            node.children.forEach(function (childNode) {
                this.addNodesByType(type, childNode);
            }.bind(this));
        }
    };

    d3.domVisualizer.prototype.removeNodesByType = function (type, node) {
        node = node || this.d3TreeRoot;

        if (typeof node._children !== "undefined") {

            for (var pos = 0; pos < node.children.length; pos++) {
                if (node.children[pos].type.indexOf(type) !== -1) {
                    node.children.splice(pos--, 1);
                }
                else {
                    this.removeNodesByType(type, node.children[pos]);
                }
            }
        }
    };

    return d3.domVisualizer;

});

