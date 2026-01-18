package com.geestack.www.web.rest;

import com.geestack.www.service.PackingService;
import com.geestack.www.service.dto.PackingSolutionDTO;
import com.geestack.www.web.rest.vm.SolveVM;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for packing optimization.
 */
@RestController
@RequestMapping("/api/packing")
public class PackingResource {

    private static final Logger LOG = LoggerFactory.getLogger(PackingResource.class);

    private final PackingService packingService;

    public PackingResource(PackingService packingService) {
        this.packingService = packingService;
    }

    /**
     * {@code POST /api/packing/solve} : Solve packing optimization problem.
     *
     * @param request the solve request
     * @return the packing solution
     */
    @PostMapping("/solve")
    public ResponseEntity<PackingSolutionDTO> solve(@Valid @RequestBody SolveVM request) {
        LOG.debug("REST request to solve packing problem");
        PackingSolutionDTO solution = packingService.solve(request);
        return ResponseEntity.ok(solution);
    }
}
