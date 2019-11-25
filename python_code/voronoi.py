import numpy as np
from scipy.spatial import Voronoi, voronoi_plot_2d
import matplotlib.pyplot as plt

class Point:
    def __init__(self, x, y):
        super().__init__()
        self.x = x
        self.y = y

class Line:
    def __init__(self, point1, point2):
        self.left = None
        self.right = None
        self.point1 = point1
        self.point2 = point2

class VoronoiWithLines:
    def __init__(self):
        super().__init__()
        self.lines = []
        self.points = []
        self.traversal_points = []
        self.voronoi_final_points = []
        self.VoronoiCal = None
        
    def create_point(self, point):
        self.points.append(point)

    def create_line(self, point1, point2, n):
        line = Line(point1, point2)
        self.populate_points(line, n)
        self.lines.append(line)

    def populate_points(self, line, n = 5):
        if n == 0:
            return
        midpoint = Point((line.point1.x + line.point2.x)/2.0, (line.point1.y + line.point2.y)/2.0)
        print(midpoint.x," ",midpoint.y)
        line.left = Line(line.point1, midpoint)
        self.populate_points(line.left, n-1)
        line.right = Line(midpoint, line.point2)
        self.populate_points(line.right, n-1)

    def simplify_points(self):
        for line in self.lines:
            self.inOrder(line)
        for point in self.points:
            self.traversal_points.append(point)

        for point in self.traversal_points:
            self.voronoi_final_points.append([point.x, point.y])
        
    def inOrder(self, line):
        if line.left == None and line.right == None:
            self.traversal_points.append(line.point1)
            # points.append(line.point2)
            return
        self.inOrder(line.left)
        self.inOrder(line.right)

    def create_voronoi(self):
        self.simplify_points()
        self.VoronoiCal = Voronoi(self.voronoi_final_points)

    def display_voronoi(self):
        fig = voronoi_plot_2d(self.VoronoiCal)
        plt.show()
        
if __name__ == "__main__":
    v = VoronoiWithLines()

    # v.create_point(Point(0, -1))
    v.create_line(Point(-1, 1), Point(1,1), 5)
    v.create_line(Point(1,1), Point(2, 0.5), 5)
    v.create_line(Point(-0.5, -1), Point(0.5, -1), 5)


    v.create_voronoi()
    v.display_voronoi()
    
