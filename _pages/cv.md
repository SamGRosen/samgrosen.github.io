---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

<script src="./test.css"> </script>

Education
======
* B.S. in Computer Science; B.S. in Mathematics, UMass Amherst, 2021 (3.9/4.0)

Work experience
======

Fall 2020
------
* Software Engineering Intern @ Datadog ![Datadog Logo](https://imgix.datadoghq.com/img/about/presskit/logo-v/logo_vertical_purple.png)

Summer 2019
------
<p id="test"> test </p>
* Devops Intern @ DraftKings {% if 'this' %} <p id="test"> test2 </p> {% endif %}
  * Created a scalable application for live tracking of release branches to production using AWS Lambda.
  * Designed serverless architecture scalable to arbitrary codebase size with complete up-to-date release data.
  * Designed DynamoDB schema and frontend with React for a responsive efficient API and user interface.
<p id="test"> test </p>


Summer 2018/2017
------
* Software Engineering Intern (Large-scala analytics group) @ Johns Hopkins University: Applied Physics Lab
  * Developed graph analytics using Java and functional programming with Gremlin for compliant graph databases.
  * Programmed low-memory implementations of machine learning algorithms for training on arbitrarily large data.
  * Created analytics for graph multi-edge merging, time-series, and data fusion using Java and MapReduce.
  * Developed random forest algorithm on a distributed data system for classifying attributes on graph vertices.
  
Summer 2016
------
* Software Engineering Intern @ General Dynamics Mission Systems
  * Worked with a partner to build a microservice acting as a REST backend to serve PDF’s with Spring.
  * Created a service to read generated reports through a REST API on a dynamic front-end with React.

Skills
======
* Skill 1
* Skill 2
  * Sub-skill 2.1
  * Sub-skill 2.2
  * Sub-skill 2.3
* Skill 3

Publications
======
  <ul>{% for post in site.publications %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Talks
======
  <ul>{% for post in site.talks %}
    {% include archive-single-talk-cv.html %}
  {% endfor %}</ul>
  
Teaching
======
  <ul>{% for post in site.teaching %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Service and leadership
======
* Currently signed in to 43 different slack teams
