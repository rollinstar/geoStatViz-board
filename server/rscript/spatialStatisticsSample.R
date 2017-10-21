library(shiny) 

library(sp)
library(spgwr)
library(rgdal)
library(DBI)
library(RPostgreSQL)
library(rgeos)
library(gstat)
library(utils)
library(Matrix)
library(spdep)
library(pgirmess)

# progress bar library
library(shinyIncubator)

require(RColorBrewer)
require(lattice)
pal = function(n = 9) brewer.pal(n, "YlOrRd")

pgConnect <- function(driver, user, pw, host, port, dbname){
  dDriver <- dbDriver(driver)
  con <- dbConnect(driver, user = user, password = pw, host = host, port = port, dbname = dbname)
  return(con)
}

pgDisconnect <- function(con){
  dbDisconnect(con)
}

#spatialData Generate
createSp <- function(con, query, code, type){
  dfTemp = dbGetQuery(con, query)
  
  row.names(dfTemp) = dfTemp$gid
  
  EPSG = make_EPSG()
  p4s = EPSG[which(EPSG$code == code), "prj4"]
  
  for (i in seq(nrow(dfTemp))) {
    if (i == 1) {
      #spTemp = readWKT(dfTemp$wkt_geometry[i], dfTemp$gid[i], dfTemp$dv[i])
      # If the PROJ4 string has been set, use the following instead
      spTemp = readWKT(dfTemp$wkt_geometry[i], dfTemp$gid[i], p4s)
    }
    else {
      spTemp = rbind(
        # spTemp, readWKT(dfTemp$wkt_geometry[i], dfTemp$gid[i], dfTemp$dv[i])
        # If the PROJ4 string has been set, use the following instead
        spTemp, readWKT(dfTemp$wkt_geometry[i], dfTemp$gid[i], p4s)
      )
    }
  }
  
  # Create SpatialPolygonsDataFrame, drop WKT field from attributes
  if(type == "polygon"){
    spdf =SpatialPolygonsDataFrame(spTemp, dfTemp[-2])
  }else{
    spdf = SpatialPointsDataFrame(spTemp, dfTemp[-2])
  }
  
  return(spdf)
}

con <- pgConnect("PostgreSQL","postgres","1111","localhost","54321","geosys")

# 부산광역시, 양산시, 김해시, 울산광역시 울주군, 진해시 지구대 및 파출소 5대범죄 발생건수
query1 = "SELECT gid, ST_AsText(geom) as wkt_geometry, homicide, rape, robbery, burglary, violence, total from policebox;"  
query2 = "SELECT gid, ST_AsText(geom) as wkt_geometry, v2 as cvs,v3 as cctv, v6 as roadNet, v8 as density, v12 as divorce, dv from gdbs;"
query3 = "SELECT gid, ST_AsText(geom) as wkt_geometry, v2 as cvs,v3 as cctv, v6 as roadNet, v8 as density, v12 as divorce,dv from crimeBusan;"

pb <- createSp(con, query1, "2097", "point")
gdbs <- createSp(con, query2, "2097", "polygon")
crimeBusan <- createSp(con, query3, "2097", "polygon")

dbDisconnect(con)

########################################################################
####                          Kriging                               ####
########################################################################
crs <- CRS("+init=epsg:2097")
s2 <- 0
interpolate <- function(code){
  #bubble(pb, zcol='total', fill=FALSE, do.sqrt=FALSE, maxsize=2)
  ## create a grid onto which we will interpolate:
  ## first get the range in data
  x.range <- as.integer(range(pb@coords[,1]))
  y.range <- as.integer(range(pb@coords[,2]))
  
  ## now expand to a grid with 500 meter spacing:
  grd <- expand.grid(x=seq(from=x.range[1], to=x.range[2], by=1500), y=seq(from=y.range[1], to=y.range[2], by=1500) )
  ## convert to SpatialPixel class
  coordinates(grd) <- ~x+y
  gridded(grd) <- TRUE
  
  proj4string(grd) <- crs

  ## test it out:
  #plot(grd, cex=0.5)
  #points(pb, pch=1, col='red', cex=0.7)
  #title("Interpolation Grid and Sample Points")
  
  res <- spTransform(pb, crs)
  
  DV <- res$total
  
  
  ## make gstat object:
  g <- gstat(id="DV", formula=DV ~ 1, data=res)
  
  ## the original data had a large north-south trend, check with a variogram map
  #plot(variogram(g, map=TRUE, cutoff=4000, width=200), threshold=10)
  
  ## another approach:
  # create directional variograms at 0, 45, 90, 135 degrees from north (y-axis)
  v <- variogram(g, alpha=c(0,45,90,135))
  
  ## 0 and 45 deg. look good. lets fit a linear variogram model:
  ## an un-bounded variogram suggests additional source of anisotropy... oh well.
  v.fit <- fit.variogram(v, model=vgm(model='Lin' , anis=c(0, 0.5)))
  
  ## plot results:
  plot(v, model=v.fit, as.table=TRUE,type="l")
  
  ## update the gstat object:
  g <- gstat(g, id="DV", model=v.fit )
  
  ## perform ordinary kriging prediction:
  p <- predict(g, model=v.fit, newdata=grd)
  
  ## visualize it:
  
  ## base graphics
  #par(mar=c(4,4,4,4))
  #image(p, col=terrain.colors(20))
  #contour(p, add=TRUE, drawlabels=FALSE, col='brown')
  #points(pb, pch=4, cex=0.5)
  #plot(gdbs, add = TRUE, col="red")
  
  lonlat <- lapply(slot(gdbs, "polygons"), function(x) lapply(slot(x,"Polygons"), function(y) slot(y, "coords")))
  lonlat[[1]]
  title('OK Prediction')
  
  ## lattice graphics: thanks for R. Bivand's advice on this
  ## 
  ## alternatively plot quantiles with
  ## ... col.regions=terrain.colors(6), cuts=quantile(p$elev.pred) ...
  ##
  pts <- list("sp.points", pb, pch = 4, col = "black", cex=0.5)
  
  #spplot(p, zcol="DV.pred", col.regions=terrain.colors(20), cuts=19, sp.layout=list(pts), contour=TRUE, labels=FALSE, pretty=TRUE, col='brown', main='OK Prediction')
  
  ## plot the kriging variance as well
  
  #spplot(p, zcol='DV.var', col.regions=heat.colors(100), cuts=99, main='OK Variance',sp.layout=list(pts) )
  
  ## quit and convert saved EPS files to PNG:
  ## for i in *.eps ; do convert $i `basename $i .eps`.png ; done
  s2 <- 1
  if(code == "grd"){
    return(grd)
  }else{
    return(p)
  }
}

########################################################################
####                            LISA                                ####
########################################################################
grb_nb <- poly2nb(gdbs)
wlistw <- nb2listw(grb_nb, style="W")
s3 <- 0
nbPlot <- function(){
  plot(gdbs, border="green")
  plot(grb_nb, coords, add=TRUE, col="red")  
  title("Grid Tract Contiguities, Busan")
  #s3 <- 1
}

cor8 <- sp.correlogram(neighbours=grb_nb, var=gdbs$dv, order=8, method="I", style="C")
corD <- correlog(coordinates(gdbs), gdbs$dv, method="Moran")
coords <- coordinates(gdbs)
lisaAnalysis <- function(){
  #moran.test(gdbs$dv,   wlistw)
  oopar <- par(mfrow=c(1,2))
  #plot(cor8, main="Contiguity lag orders")
  #plot(corD, main="Distance bands")
  par(oopar)
  #oopar <- par(mfrow=c(1,2))
  msp <- moran.plot(gdbs$dv, listw=nb2listw(grb_nb, style="C"), quiet=TRUE)
  title("Moran scatterplot")
  infl <- apply(msp$is.inf, 1, any)
  x <- gdbs$dv
  lhx <- cut(x, breaks=c(min(x), mean(x), max(x)), labels=c("L", "H"), include.lowest=TRUE)
  wx <- lag(nb2listw(grb_nb, style="C"), gdbs$dv)
  lhwx <- cut(wx, breaks=c(min(wx), mean(wx), max(wx)), labels=c("L", "H"), include.lowest=TRUE)
  lhlh <- interaction(lhx, lhwx, infl, drop=TRUE)
  cols <- rep(1, length(lhlh))
  cols[lhlh == "H.L.TRUE"] <- 2
  cols[lhlh == "L.H.TRUE"] <- 3
  cols[lhlh == "H.H.TRUE"] <- 4
  plot(crimeBusan, col=brewer.pal(4, "Accent")[cols], )
  legend("topright", legend=c("None", "HL", "LH", "HH"), fill=brewer.pal(4, "Accent"), bty="n", cex=0.8, y.intersp=0.8)
  title("Tracts with influence")
  par(oopar)
  s3 <- 1
}


########################################################################
####                      Moran's I                                 #### 
########################################################################
s4 <- 0
globalMoranIPlot <- function(){
  moran.plot(gdbs$dv,   wlistw)
}

globalMoranISummary <- function(){
  
  s4 <- 1
}

########################################################################
####                            GWR                                 #### 
########################################################################
g.adapt.gauss <- gwr.sel(dv ~ cvs + cctv + roadnet + density + divorce, data=crimeBusan, adapt=TRUE)
res.adpt <- gwr(dv ~ cvs + cctv + roadnet + density + divorce, data=crimeBusan, adapt=g.adapt.gauss)
s5 <- 0
gwrPlot <- function(){
  #gpclibPermit()
  #bw = gwr.sel(dv ~ v1, data=crimeBusan, adapt=T)
  #gwr.model = gwr(dv ~ v1, data=crimeBusan, adapt=bw, hatmatrix=T, se.fit=T) 
  #colours = c("dark blue", "blue", "red", "dark red") 
  
  s5 <- 1
  #return res.adpt
  
  #pairs(as(res.adpt$SDF, "data.frame")[,2:8], pch=".")
  #brks <- c(-0.25, 0, 0.01, 0.025, 0.075)
  #cols <- grey(5:2/6)
  #plot(res.adpt$SDF, col=cols[findInterval(res.adpt$SDF$V1, brks, all.inside=TRUE)])
}


# Define server logic required to summarize and view the selected dataset
shinyServer(function(input, output,session) {
  
  anotherExpensiveOperation <- function() {
    # It's OK for withProgress calls to nest; they will have
    # a stacked appearance in the UI.
    #
    # Use min/max and setProgress(value=x) for progress bar
    withProgress(session, min = 0, max = 10, {
      setProgress(message = "Here's a sub-task")
      for (i in 1:10) {
        setProgress(value = i)
        if (i == 7)
          setProgress(detail = "Sorry, this is taking a while")
        Sys.sleep(0.3)
      }
    })
  }
  
  # Return the requested dataset
  
  data <- reactive({
    spData <- switch(input$attrTable,
                   "pb" = pb,
                   "gdbs" = gdbs
            )
    
    head(data.frame(spData), n = input$obs)
  })

  #datasetInput <- reactive({
  #  switch(input$dataset,
  #         "select spatialData" = "none",
  #         "m1",
  #         "m2")
  #})
  
  #cvs + cctv + roadnet + density + divorce
  setGWR <- reactive({
    switch(input$iv,
          "cvs" = res.adpt$SDF$cvs,
          "cctv" = res.adpt$SDF$cctv,
          "roadnet" = res.adpt$SDF$roadnet,
          "density" = res.adpt$SDF$density,
          "divorce" = res.adpt$SDF$divorce
           )
  })
  

  
  output$mapView <- renderPlot({
    if(input$tabs != "step1")
      return()
    
    #spData <- input$dataset
    #analysis <- input$analysis
    mv <- input$dataset
    if(mv == "m1"){
        withProgress(session, {
          setProgress(message = "Calculating, please wait",
                      detail = "This may take a few moments...")
          Sys.sleep(1)
          setProgress(detail = "Still working...")
          Sys.sleep(1)
          anotherExpensiveOperation()
          Sys.sleep(1)
          setProgress(detail = "Almost there...")
          Sys.sleep(1)
      
          #print(
            #spplot(gdbs, c("dv"), col.regions = pal(), cuts = 8, colorkey=TRUE, sp.layout = pb)
            plot(gdbs, col = "grey")
            plot(pb, pch=16, cex=1,add=TRUE, col="red")
            title("Police Box in Busan")
          #)
        })
      }else if(mv == "m2"){
        withProgress(session, {
          setProgress(message = "Calculating, please wait",
                      detail = "This may take a few moments...")
          Sys.sleep(1)
          setProgress(detail = "Still working...")
          Sys.sleep(1)
          anotherExpensiveOperation()
          Sys.sleep(1)
          setProgress(detail = "Almost there...")
          Sys.sleep(1)
          
          #print(
          #spplot(dataset, c("homicide", "rape", "robbery", "total", "violence", "burglary"), col.regions = pal(), cuts = 8, colorkey=TRUE), split = c(1,1,1,1) 
          #spplot(dataset, c("total"), col.regions = pal(), cuts = 8, colorkey=TRUE), split = c(1,1,1,1) 
          #bubble(pb, "total", maxsize = 2.5, main = "Rate of 5 Major Crime", key.entries = 2^(-1:4))
          #spl <- list('sp.lines', as(gdbs, 'SpatialLines'))
          basemap = list('sp.polygons', gdbs, fill = 'grey')
          bubble(pb, "total",col="green", main = "5 Major Crimes in Busan(2013)", key.space = "bottom",key.entries =  100 * 2^(0:4),sp.layout = basemap)
          #)  
        })
      }else{
        plot(gdbs, col="grey")
        title("Busan")
      }
  })
  
  output$summary <- renderPrint({
    if(input$tabs != "step1")
      return()
    
    mv <- input$dataset
    
    if(mv == "m1"){
      summary(dist(pb$total))
    }else if(mv == "m2"){
      summary(dist(pb$total))
    }else{summary(
      dist(pb$total))
    }
  })
  
  # Show the first "n" observations
  output$dataView <- renderTable({
    if(input$tabs != "step1")
      return()  
    
    #mv <- input$attrTable
    
    #if(mv == "m1"){
    #  head(data.frame(pb), n = input$obs)
    #}else if(mv == "m2"){
    #  head(data.frame(pb), n = input$obs)
    #}else{
    #  head(data.frame(gdbs), n = input$obs)
    #}
    #spDataSet <- datasetInput()
    #data.frame(x=data())
    data()    
  })
  
  #output$value <- renderPrint({ input$action })
  
  ## Kriging Output ##
  output$krg1 <- renderPlot({
    if(s2 == 1)
      return()
    
    grd <- interpolate("grd")
    pts <- list("sp.points", pb, pch = 4, col = "black", cex=0.5)
    ## test it out:

    withProgress(session, {
      setProgress(message = "Calculating, please wait",
                  detail = "This may take a few moments...")
      Sys.sleep(1)
      setProgress(detail = "Still working...")
      Sys.sleep(1)
      anotherExpensiveOperation()
      Sys.sleep(1)
      setProgress(detail = "Almost there...")
      Sys.sleep(1)
      #print(
      ## test it out:
      #spplot(p, zcol="DV.pred", col.regions=terrain.colors(20), cuts=19, sp.layout=list(pts), contour=TRUE, labels=FALSE, pretty=TRUE, col='brown', main='OK Prediction')
      plot(grd, cex=0.5)
      points(pb, pch=1, col='red', bg="black" ,cex=0.7)
      title("Interpolation Grid and Sample Points")
      #)
      #points(pb, pch=1, col='red', cex=0.7)
      #title("Interpolation Grid and Sample Points") 
    })
  })
  
  output$krg2 <- renderPlot({
    if(s2 == 1)
      return()
    
    p <- interpolate("p")
    pts <- list("sp.points", pb, pch = 1, col = "black", cex=1, fill="black")
    ## test it out:
    #print(
    #
    if(input$plotType == "p"){
      spplot(p, zcol="DV.pred", col.regions=terrain.colors(20), cuts=19, sp.layout=list(pts), contour=TRUE, labels=FALSE, pretty=TRUE, col='brown', main='Prediction') 
    }else if(input$plotType == "l"){
      withProgress(session, {
        setProgress(message = "Calculating, please wait",
                    detail = "This may take a few moments...")
        Sys.sleep(1)
        setProgress(detail = "Still working...")
        Sys.sleep(1)
        anotherExpensiveOperation()
        Sys.sleep(1)
        setProgress(detail = "Almost there...")
        Sys.sleep(1)
        spplot(p, zcol='DV.var', col.regions=heat.colors(100), cuts=99, key.space = "right", main='Oddinary Kriging',sp.layout=list(pts))    
      })
    }else{
      withProgress(session, {
        setProgress(message = "Calculating, please wait",
                    detail = "This may take a few moments...")
        Sys.sleep(1)
        setProgress(detail = "Still working...")
        Sys.sleep(1)
        anotherExpensiveOperation()
        Sys.sleep(1)
        setProgress(detail = "Almost there...")
        Sys.sleep(1)
        print(
          spplot(gdbs, c("dv"), col.regions = pal(), cuts = 8, colorkey=TRUE), split = c(1,1,1,1) 
        )
        title("")
      })
    }
    #)
    
  })
  
  output$conti <- renderPlot({
    if(s3 == 1)
      return()
    nbPlot()
  })
  
  output$lisa <- renderPlot({
    if(s3 == 1)
      return()
      
    withProgress(session, {
      setProgress(message = "Calculating, please wait",
                  detail = "This may take a few moments...")
      Sys.sleep(1)
      setProgress(detail = "Still working...")
      Sys.sleep(1)
      anotherExpensiveOperation()
      Sys.sleep(1)
      setProgress(detail = "Almost there...")
      Sys.sleep(1)
      lisaAnalysis()
    })
    
  })

  output$spa1 <- renderPlot({
    if(s4 == 1)
      return()
    globalMoranIPlot()
  })
  
  output$spa2 <- renderPrint({
    #if(s4 == 1)
    #  return()
    moran.test(gdbs$dv,   wlistw)
    #globalMoranISummary()
  })
  
  output$gwr <- renderPlot({
    if(s5 == 1)
      return()
    #bw = gwr.sel(dv ~ cvs, data=crimeBusan, adapt=T)
    #gwr.model = gwr(dv ~ cvs, data=crimeBusan, adapt=bw, hatmatrix=T, se.fit=T) 
    #colours = c("dark blue", "blue", "red", "dark red") 
    #v2 as cvs,v3 as cctv, v6 as roadNet, v8 as density, v12 as divorce
    
    iv <- setGWR()
    withProgress(session, {
      setProgress(message = "Calculating, please wait",
                  detail = "This may take a few moments...")
      Sys.sleep(1)
      setProgress(detail = "Still working...")
      Sys.sleep(1)
      anotherExpensiveOperation()
      Sys.sleep(1)
      setProgress(detail = "Almost there...")
      Sys.sleep(1)
      pairs(as(res.adpt$SDF, "data.frame")[,2:8], pch=".")
      brks <- c(-0.25, 0, 0.01, 0.025, 0.075)
      cols <- grey(5:2/6)
      plot(res.adpt$SDF, col=cols[findInterval(iv, brks, all.inside=TRUE)]) 
      title(input$iv)
    })
  })
  
  #output$comp <- renderPlot({
  #  aa <- input$iv
  #  withProgress(session, {
  #    setProgress(message = "Calculating, please wait",
  #                detail = "This may take a few moments...")
  #    Sys.sleep(1)
  #    setProgress(detail = "Still working...")
  #    Sys.sleep(1)
  #    anotherExpensiveOperation()
  #    Sys.sleep(1)
  #    setProgress(detail = "Almost there...")
  #    Sys.sleep(1)
  #    spplot(crimeBusan, c(aa), col.regions = pal(), cuts = 8, colorkey=TRUE)
  #  })
  #})
  
  output$gwrInfo <- renderPrint({
    #if(s4 == 1)
    #  return()
    print(res.adpt)
    
    #globalMoranISummary()
  })
  
})