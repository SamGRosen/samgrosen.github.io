---
layout: archive
title: "Writings"
permalink: /writings/
author_profile: true
---

{% include base_path %}

{% for post in site.writings reversed %}
  {% include archive-single.html %}
{% endfor %}
